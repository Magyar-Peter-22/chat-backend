import niv from "node-input-validator";

niv.extend('username', ({ value }) => {
    if (!is_string(value))
        return false;

    const length = value.length;
    return (length >= 1 && length <= 30);
});

niv.extend('password', ({ value }) => {
    if (!is_string(value))
        return false;

    const length = value.length;
    return (length >= 8 && length <= 30);
});

function is_string(val) {
    return typeof val === "string";
}