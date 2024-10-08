import { CheckErr } from "./app/expressErrorHandler.js";

async function checkV(v) {
    const matched = await v.check();
    if (!matched) {
        CheckErr(Object.values(v.errors)[0].message);
    }
}

export { checkV };
