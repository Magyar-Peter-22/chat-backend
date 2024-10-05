async function aggregateOne(Schema, pipeline) {
    const aggCursor = await Schema.aggregate(pipeline).cursor();
    const result = (await aggCursor.toArray())[0];
    return result;
}

function project(projectObject, document) {
    if (!document)
        return;
    //apply projection to a returned document
    const filtered = {};
    Object.keys(projectObject).forEach(key => { filtered[key] = document[key] });
    return filtered;
}

export { aggregateOne, project }