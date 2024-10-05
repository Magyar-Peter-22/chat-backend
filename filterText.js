//remove illegal whitespaces
function cleanWhitespaces(text) {
    return text.replaceAll(/^\s+|\s+$| (?= )|\s{2,}(?=\s)/g, "");
}

export {cleanWhitespaces}