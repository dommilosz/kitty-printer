import { createRef } from "preact";
import { CAT_ADV_SRV, CAT_PRINT_RX_CHAR, CAT_PRINT_SRV, CAT_PRINT_TX_CHAR, DEF_CANVAS_WIDTH, STUFF_PAINT_INIT_URL } from "../common/constants.ts";
import { BitmapData, PrinterProps } from "../common/types.ts";
import StuffPainter from "./StuffPainter.tsx";
import { useMemo, useReducer } from "preact/hooks";
import { Icons } from "../common/icons.tsx";
import { _ } from "../common/i18n.tsx";
import { CatPrinter } from "../common/cat-protocol.ts";
import { delay } from "https://deno.land/std@0.193.0/async/delay.ts";
import {useLocalStorage} from "../common/hooks.ts";
import Settings from "./Settings.tsx";
import { useState } from "preact/hooks";

declare let navigator: Navigator & {
    // deno-lint-ignore no-explicit-any
    bluetooth: any;
};

function arrayEqual<T extends ArrayLike<number | string>>(a: T, b: T) {
    if (a.length !== b.length)
        return false;
    for (let i = 0; i < a.length; ++i)
        if (a[i] !== b[i])
            return false;
    return true;
}

function rgbaToBits(data: Uint32Array) {
    const length = data.length / 8 | 0;
    const result = new Uint8Array(length);
    for (let i = 0, p = 0; i < data.length; ++p) {
        result[p] = 0;
        for (let d = 0; d < 8; ++i, ++d)
            result[p] |= data[i] & 0xff & (0b1 << d);
        result[p] ^= 0b11111111;
    }
    return result;
}

export default function Printer(props: PrinterProps) {
    const [bitmap_data, dispatch] = useReducer<Record<number, BitmapData>, BitmapData>((data, update) => {
        data[update.index] = update;
        return data;
    }, {});

    let [settingsVisible, setSettingsVisible] = useState(false)

    const stuffs = props.stuffs;
    if (stuffs.length === 0)
        return <div class="kitty-preview">
            <img src={STUFF_PAINT_INIT_URL} width={DEF_CANVAS_WIDTH} height={1} />
        </div>;
    const preview_ref = createRef();
    const preview = <div ref={preview_ref} class="kitty-preview">
        {stuffs.map((stuff, index) =>
            useMemo(() => <StuffPainter stuff={stuff} index={index}
                dispatch={dispatch} width={DEF_CANVAS_WIDTH} />
            , [JSON.stringify(stuff)])
        )}
    </div>;
    const print = async () => {
        let speed = localStorage.getItem("speed");
        let energy = localStorage.getItem("energy");
        let finishFeed = localStorage.getItem("finishFeed");

        const device = await navigator.bluetooth.requestDevice({
            filters: [{ services: [ CAT_ADV_SRV ] }],
            optionalServices: [ CAT_PRINT_SRV ]
        });
        const server = await device.gatt.connect();
        try {
            const service = await server.getPrimaryService(CAT_PRINT_SRV);
            const [tx, rx] = await Promise.all([
                service.getCharacteristic(CAT_PRINT_TX_CHAR),
                service.getCharacteristic(CAT_PRINT_RX_CHAR)
            ]);
            const printer = new CatPrinter(
                device.name,
                tx.writeValueWithoutResponse.bind(tx),
                false
            );
            const notifier = () => {
                //@ts-ignore:
                const data: DataView = event.target.value;
                const message = new Uint8Array(data.buffer);
                printer.notify(message);
            };

            // TODO: be aware of other printer state
            await rx.startNotifications()
                .then(() => rx.addEventListener('characteristicvaluechanged', notifier))
                .catch((error: Error) => console.log(error));

            await printer.prepare(speed, energy);
            for (const stuff of stuffs) {
                const data = bitmap_data[stuff.id];
                const bitmap = rgbaToBits(new Uint32Array(data.data.buffer));
                const pitch = data.width / 8 | 0;
                for (let i = 0; i < data.height * pitch; i += pitch) {
                    const line = bitmap.slice(i, i + pitch);
                    if (line.every(byte => byte === 0))
                        await printer.feed(1);
                    else
                        await printer.draw(line);
                }
            }

            await printer.finish(finishFeed);
            await rx.stopNotifications().then(() => rx.removeEventListener('characteristicvaluechanged', notifier));
        } finally {
            await delay(500);
            if (server) server.disconnect();
        }
    };
    const print_menu = <div>
        <div class="print-menu">
            <button class="stuff stuff--button" style={{width:"80%"}} aria-label={_('print')} onClick={print}>
                <Icons.IconPrinter />
            </button>
            <button class="stuff stuff--button" style={{width:"20%"}} aria-label={_('settings')} onClick={()=>setSettingsVisible(!settingsVisible)}>
                <Icons.IconSettings />
            </button>
        </div>
        <Settings visible={settingsVisible}/>
    </div>;
    return <>
        {preview}
        {print_menu}
    </>;
}
