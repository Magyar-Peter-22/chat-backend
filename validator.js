async function checkV(v) {
    const matched = await v.check();
    if (!matched) {
        throw Object.values(v.errors)[0].message;
    }
}

export { checkV };
