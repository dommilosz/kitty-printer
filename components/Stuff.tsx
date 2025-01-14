import { JSX } from "preact/jsx-runtime";
import { Icons } from "../common/icons.tsx";
import { IconKey, StuffData, StuffProps } from "../common/types.ts";
import { _ } from "../common/i18n.tsx";
import { DEF_CANVAS_WIDTH } from "../common/constants.ts";
import { useState } from "preact/hooks";
import { createRef } from "preact";

const commonsize = [
    0, 4, 8, 9, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 60, 72, 84, 96, 120, 150, 180, 240, 280, 320, DEF_CANVAS_WIDTH
];

function nextsize(size: number) { return commonsize[commonsize.indexOf(size) + 1] || commonsize.at(-1); }
function prevsize(size: number) { return commonsize[commonsize.indexOf(size) - 1] || commonsize[0]; }

export default function Stuff(props: StuffProps) {
    const [show_options, set_show_options] = useState(false);
    const dispatch = props.dispatch;
    const stuff = props.stuff;
    let type: string;
    let icon: IconKey;
    let body: JSX.Element;
    let options: JSX.Element;
    function mkmodify(stuffkey: keyof StuffData, value?: string | number) {
        return function(event: Event) {
            //@ts-ignore:
            stuff[stuffkey] = value ?? event.currentTarget.value;
            dispatch({ action: 'modify', stuff: stuff });
        }
    }
    function mkmodifyboolean(stuffkey: keyof StuffData, value?: boolean) {
        return function(event: Event) {
            //@ts-ignore:
            stuff[stuffkey] = value ?? event.currentTarget.checked;
            dispatch({ action: 'modify', stuff: stuff });
        }
    }
    function mkmodifynumber(stuffkey: keyof StuffData, value?: string | number) {
        return function(event: Event) {
            //@ts-ignore:
            const number = parseFloat(value ?? event.currentTarget.value);
            //@ts-ignore:
            stuff[stuffkey] = isNaN(number) ? 0 : number;
            dispatch({ action: 'modify', stuff: stuff });
        }
    }
    const choose_pic = (event: Event) => {
        const pic = event.currentTarget as HTMLImageElement;
        const img = document.createElement('img');
        const selector = document.createElement('input');
        selector.type = 'file';
        selector.addEventListener('change', () => {
            const file = selector.files![0];
            if (!file) return;
            img.src = URL.createObjectURL(file);
            img.addEventListener('load', () => {
                const canvas = document.createElement('canvas');
                const ratio = img.width / img.height;
                // downscale but keep sufficient resolution for both rotation
                if (ratio >= 1) {
                    img.height = DEF_CANVAS_WIDTH;
                    img.width = DEF_CANVAS_WIDTH * ratio;
                } else {
                    img.width = DEF_CANVAS_WIDTH;
                    img.height = DEF_CANVAS_WIDTH / ratio;
                }
                pic.width = canvas.width = img.width;
                pic.height = canvas.height = img.height;
                const ctx = canvas.getContext('2d')!;
                ctx.drawImage(img, 0, 0, img.width, img.height);
                URL.revokeObjectURL(img.src);
                stuff.picUrl = img.src = canvas.toDataURL();
                // pic src updated automatically
                dispatch({ action: 'modify', stuff: stuff });
            }, { once: true });
        }, { once: true });
        selector.click();
    }
    const change_type = (event: JSX.TargetedEvent<HTMLSelectElement, Event>) => {
        const value = event.currentTarget.value as StuffData['type'];
        stuff.type = value;
        switch (value) {
            case 'text':
                stuff.dither = 'text';
                break;
            case 'pic':
                stuff.dither = 'pic';
                break;
        }
        dispatch({ action: 'modify', stuff: stuff });
    };
    switch (stuff.type) {
        case 'void':
            return <></>;
        case 'text':
            type = 'text';
            icon = 'IconFileText';
            body = <>
                <textarea class={"stuff__textfield" + (stuff.textStroked ? ' stuff__textfield--stroked' : '')}
                    style={`
                        text-align: ${stuff.textAlign};
                        font-family: ${stuff.textFontFamily};
                        font-size: ${stuff.textFontSize}px;
                        font-weight: ${stuff.textFontWeight};
                        line-height: ${stuff.textFontSize! + stuff.textLineSpacing!}px;
                    `}
                    name={'stuff-textfield-' + stuff.id.toString()}
                    onKeyUp={mkmodify('textContent')}
                    onBlur={mkmodify('textContent')}
                    placeholder={_('hello-world')}
                >{stuff.textContent}</textarea>
            </>;
            options = <>
                <div class="stuff__option">
                    <span class="option__title">{_('align')}</span>
                    <button class="option__item" value="start"
                        onClick={mkmodify('textAlign')} aria-label={_('left')}
                        data-selected={stuff.textAlign === 'start'}>
                        <Icons.IconAlignLeft />
                    </button>
                    <button class="option__item" value="center"
                        data-selected={stuff.textAlign === 'center'}
                        onClick={mkmodify('textAlign')} aria-label={_('center')}>
                        <Icons.IconAlignCenter />
                    </button>
                    <button class="option__item" value="justify"
                        data-selected={stuff.textAlign === 'justify'}
                        onClick={mkmodify('textAlign')} aria-label={_('justify')}>
                        <Icons.IconAlignJustified />
                    </button>
                    <button class="option__item" value="end"
                        data-selected={stuff.textAlign === 'end'}
                        onClick={mkmodify('textAlign')} aria-label={_('right')}>
                        <Icons.IconAlignRight />
                    </button>
                </div>
                <div class="stuff__option">
                    <span class="option__title">{_('font')}</span>
                    <input class="option__item" type="text" value={stuff.textFontFamily} onInput={mkmodify('textFontFamily')} />
                </div>
                <div class="stuff__option">
                    <span class="option__title">{_('font-size')}</span>
                    <button class="option__item" onClick={mkmodifynumber('textFontSize', prevsize(stuff.textFontSize!))}>
                        <Icons.IconTextDecrease />
                    </button>
                    <input class="option__item" type="text" inputMode="numeric" onInput={mkmodifynumber('textFontSize')}
                        value={stuff.textFontSize} min={commonsize[0]} max={commonsize.at(-1)} step={1} />
                    <button class="option__item" onClick={mkmodifynumber('textFontSize', nextsize(stuff.textFontSize!))}>
                        <Icons.IconTextIncrease />
                    </button>
                </div>
                <div class="stuff__option">
                    <span class="option__title">{_('line-spacing')}</span>
                    <button class="option__item" onClick={mkmodifynumber('textLineSpacing', prevsize(stuff.textLineSpacing!))}>
                        <Icons.IconArrowsDiagonalMinimize2 />
                    </button>
                    <input class="option__item" type="text" inputMode="numeric" onInput={mkmodifynumber('textLineSpacing')}
                        value={stuff.textLineSpacing} min={commonsize[0]} max={commonsize.at(-1)} step={1} />
                    <button class="option__item" onClick={mkmodifynumber('textLineSpacing', nextsize(stuff.textLineSpacing!))}>
                        <Icons.IconArrowsDiagonal />
                    </button>
                </div>
                {/*
                <div class="stuff__option">
                    <span class="option__title">{_('offset')}</span>
                    <input class="option__item" type="range" min={-1} max={1} step={0.05} value={stuff.textOffset} onChange={mkmodifynumber('textOffset')} />
                    <button class="option__item" onClick={mkmodifynumber('textOffset', 0)}>
                        <Icons.IconLayoutAlignMiddle />
                    </button>
                </div>
                */}
                <div class="stuff__option">
                    <span class="option__title">{_('stroked')}</span>
                    <input type="checkbox" onChange={mkmodifyboolean('textStroked')} checked={stuff.textStroked} />
                </div>
                <div class="stuff__option">
                    <span class="option__title">{_('brightness')}</span>
                    <input class="option__item" type="range" min={0} max={255} step={4}
                        value={stuff.brightness} onChange={mkmodifynumber('brightness')} />
                </div>
            </>;
            break;
        case 'pic':
            type = 'pic';
            icon = 'IconPhoto';
            body = <>
                <div class="stuff__pic-box">
                    <img class="stuff__pic" src={stuff.picUrl} onClick={choose_pic}
                        alt={_('stuff-picture-0', stuff.id)} style={`
                            transform:
                                rotate(${stuff.rotate}deg)
                                scaleX(${stuff.flipH ? -1 : 1})
                                scaleY(${stuff.flipV ? -1 : 1});
                        `} width={384} height={384} />
                </div>
            </>;
            options = <>
                <div class="stuff__option">
                    <span class="option__title">{_('process-as')}</span>
                    <button class="option__item" value="pic"
                        onClick={mkmodify('dither')}
                        data-selected={stuff.dither === 'pic'}>
                        <Icons.IconPhoto />
                        <span class="stuff__label">{_('picture')}</span>
                    </button>
                    <button class="option__item" value="text"
                        onClick={mkmodify('dither')}
                        data-selected={stuff.dither === 'text'}>
                        <Icons.IconTextCaption />
                        <span class="stuff__label">{_('text')}</span>
                    </button>
                </div>
                <div class="stuff__option">
                    <span class="option__title">{_('rotate')}</span>
                    <button class="option__item" value="0"
                        onClick={mkmodifynumber('rotate')} aria-label={_('rotate^none')}
                        data-selected={stuff.rotate === 0}>
                        <span class="stuff__label">{_('rotate^none')}</span>
                    </button>
                    <button class="option__item" value="90"
                        onClick={mkmodifynumber('rotate')} aria-label={_('90-degree')}
                        data-selected={stuff.rotate === 90}>
                        <Icons.IconRotateClockwise2 />
                    </button>
                    <button class="option__item" value="180"
                        onClick={mkmodifynumber('rotate')} aria-label={_('180-degree')}
                        data-selected={stuff.rotate === 180}>
                        <Icons.IconRotateClockwise />
                    </button>
                    <button class="option__item" value="270"
                        onClick={mkmodifynumber('rotate')} aria-label={_('270-degree')}
                        data-selected={stuff.rotate === 270}>
                        <Icons.IconRotate2 />
                    </button>
                </div>
                <div class="stuff__option">
                    <span class="option__title">{_('flip')}</span>
                    <label class="option__item">
                        <input type="checkbox" onChange={mkmodifyboolean('flipH')}
                            checked={stuff.flipH} aria-label={_('flip^horizontal')} />
                        <Icons.IconFlipVertical />
                    </label>
                    <label class="option__item">
                        <input type="checkbox" onChange={mkmodifyboolean('flipV')}
                            checked={stuff.flipV} aria-label={_('flip^vertical')} />
                        <Icons.IconFlipHorizontal />
                    </label>
                </div>
                <div class="stuff__option">
                    <span class="option__title">{_('brightness')}</span>
                    <input class="option__item" type="range" min={0} max={255} step={4}
                        value={stuff.brightness} onChange={mkmodifynumber('brightness')} />
                </div>
            </>;
            break;
        default:
            type = 'stuff';
            icon = 'IconQuestionMark';
            body = <>
                <p>{_('unknown-stuff-0', '' + stuff.type)}</p>
            </>;
            options = <></>;
            break;
    }
    const ref_options = createRef();
    const StuffIcon = Icons[icon];
    return <div class="stuff" key={stuff.id}>
        <div class="stuff__panel">
            <div class="stuff__title">
                <StuffIcon size={32} />
                {!show_options ? <>
                        <select onChange={change_type} name={'stuff-type-' + stuff.id.toString()}>
                            <option value="text" selected={type === 'text'}>{_('text')}</option>
                            <option value="pic" selected={type === 'pic'}>{_('picture')}</option>
                        </select>
                    </> : <></>
                }
            </div>
            <div class="stuff__menu">
                {show_options /* && stuff.id !== 0 */ ?
                    <button key="moveup" class="stuff__button" aria-label={_("move-up")}
                        onClick={() => {
                            dispatch({ action: 'moveup', stuff: stuff });
                            set_show_options(false);
                        }}>
                        <Icons.IconArrowBarUp />
                    </button> : <></>
                }
                {show_options ?
                    <button key="movedown" class="stuff__button" aria-label={_("move-down")}
                        onClick={() => {
                            dispatch({ action: 'movedown', stuff: stuff });
                            set_show_options(false);
                        }}>
                        <Icons.IconArrowBarDown />
                    </button> : <></>
                }
                <button key="options" class="stuff__button" aria-label={_("options")}
                    onClick={() => set_show_options(!show_options)}>
                    <Icons.IconAdjustmentsHorizontal />
                </button>
                <button key="remove" class="stuff__button" aria-label={_("remove")} onClick={() => dispatch({
                    action: 'remove',
                    stuff: stuff
                })}>
                    <Icons.IconX />
                </button>
            </div>
        </div>
        <form class={"stuff__options-container" + (show_options ? ' stuff__options-container--visible' : '')}
            ref={ref_options} name={'stuff-options-' + stuff.id.toString()}
            onSubmit={(event) => event.preventDefault()}
            onClick={(event) => event.stopPropagation()}
            onFocus={() => set_show_options(true)}
            onBlur={() => set_show_options(false)}
        >
            <div class="stuff__options">{options}</div>
        </form>
        <div class="stuff__content">{body}</div>
    </div>;
}
