import { useReducer } from "preact/hooks";
import { DEF_CANVAS_WIDTH, STUFF_PAINT_INIT_URL, STUFF_STOREKEY } from "../common/constants.ts";
import { _ } from "../common/i18n.tsx";
import { Icons } from "../common/icons.tsx";
import { KittyCanvasProps, StuffData, StuffUpdate } from "../common/types.ts";
import Printer from "../components/Printer.tsx";
import Stuff from "../components/Stuff.tsx";

function timestamp() {
    return new Date().getTime();
}

function properStuff(stuff: StuffData) {
    switch (stuff.type) {
        case 'text':
            stuff = Object.assign({
                dither: 'text',
                rotate: 0,
                flipH: false,
                flipV: false,
                brightness: 128,
                textContent: '',
                textAlign: 'start',
                textFontFamily: 'sans-serif',
                textFontSize: 16,
                textLineSpacing: (stuff.textFontSize || 16) / 2 | 0,
                textFontWeight: '',
                textOffset: 0
            }, stuff);
            break;
        case 'pic':
            stuff = Object.assign({
                dither: 'pic',
                rotate: 0,
                flipH: false,
                flipV: false,
                brightness: 128,
                picUrl: 'kitty.svg',
                picFlipH: false,
                picFlipV: false
            }, stuff);
            break;
    }
    return stuff;
}

export default function KittyCanvas(props: KittyCanvasProps) {
    const initial_stuffs: StuffData[] = [
        { type: 'text', id: 0, textContent: _('welcome').value, textAlign: 'center', textFontSize: 24 },
        { type: 'pic', id: 1, picUrl: 'kitty.svg' }
    ];
    let stored_stuffs: StuffData[];
    try {
        //@ts-expect-error:
        stored_stuffs = JSON.parse(localStorage.getItem(STUFF_STOREKEY)).map(s => properStuff(s));
        if (stored_stuffs.length === 0) throw new Error();
    } catch (_error) {
        // console.error(error);
        stored_stuffs = initial_stuffs.map(s => properStuff(s));
        if (typeof localStorage === 'object') // unavailable in deno deploy
            localStorage.setItem(STUFF_STOREKEY, JSON.stringify(stored_stuffs));
    }
    const [stuffs, dispatch] = useReducer<StuffData[], StuffUpdate>((data, update) => {
        const stuff = update.stuff;
        const index = stuffs.indexOf(stuff);
        switch (update.action) {
            case 'add':
                if (index === -1)
                    data.push(stuff);
                else
                    data.splice(index, 0, stuff);
                break;
            default:
                switch (update.action) {
                    case 'modify':
                        break;
                    case 'remove':
                        stuff.type = 'void';
                        break;
                    case 'moveup':
                        if (index === 0) {
                            break;
                        } else if (index === -1) {
                            stuffs.unshift(stuff);
                        } else {
                            stuffs.splice(index, 1);
                            stuffs.splice(index - 1, 0, stuff);
                        }
                        break;
                    case 'movedown':
                        if (index === stuffs.length - 1) {
                            break;
                        } else if (index === -1) {
                            stuffs.push(stuff);
                        } else {
                            stuffs.splice(index, 1);
                            stuffs.splice(index + 1, 0, stuff);
                        }
                        break;
                }
                break;
        }
        let newid = 0;
        data = data.filter(s => s.type !== 'void').map(s => (s.id = newid++, s)).map(s => properStuff(s));
        localStorage.setItem(STUFF_STOREKEY, JSON.stringify(data));
        return data;
    }, stored_stuffs);
    const comp = <div class="kitty-container">
        <div class="kitty-canvas">
            {stuffs.map(stuff => Stuff({ dispatch, stuff }))}
            <button class="stuff stuff--button" aria-label={_('add')} onClick={() => {
                dispatch({
                    action: 'add',
                    stuff: { type: 'text', id: 0 }
                });
            }}>
                <Icons.IconPlus size={36} />
            </button>
        </div>
        <div>
            <Printer stuffs={stuffs} />
        </div>
    </div>;
    return comp;
}
