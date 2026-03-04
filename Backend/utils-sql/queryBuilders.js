// Helper to wrap strings in quotes, but leave numbers alone
function formatValue(val) {
    if (typeof val === 'string') {
        return "'" + val + "'";
    }
    return val;
}

// Manual WHERE clause builder
function buildWhere(conditions) {
    if (!conditions || conditions.length === 0) {
        return "";
    }

    let parts = [];
    for (let i = 0; i < conditions.length; i++) {
        let c = conditions[i];
        parts.push(c.field + " " + c.operator + " " + formatValue(c.value));
    }

    return " WHERE " + parts.join(" AND ");
}

export function buildSelect(p) {
    let sql = "SELECT " + (p.columns || "*") + " FROM " + p.table;
    
    sql += buildWhere(p.conditions);

    if (p.orderBy) {
        sql += " ORDER BY " + p.orderBy + " " + (p.direction || "ASC");
    }

    if (p.limit) {
        sql += " LIMIT " + p.limit;
    }

    return sql + ";";
}

export function buildInsert(p) {
    let keys = Object.keys(p.values);
    let valuesArray = [];

    for (let i = 0; i < keys.length; i++) {
        valuesArray.push(formatValue(p.values[keys[i]]));
    }

    let sql = "INSERT INTO " + p.table + " (" + keys.join(", ") + ") ";
    sql += "VALUES (" + valuesArray.join(", ") + ") ";
    sql += "RETURNING " + (p.returning || "*");

    return sql + ";";
}

export function buildUpdate(p) {
    let setParts = [];
    let keys = Object.keys(p.set);

    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let val = formatValue(p.set[key]);
        setParts.push(key + " = " + val);
    }

    let sql = "UPDATE " + p.table + " SET " + setParts.join(", ");
    sql += buildWhere(p.conditions);
    sql += " RETURNING " + (p.returning || "*");

    return sql + ";";
}

export function buildDelete(p) {
    let sql = "DELETE FROM " + p.table;
    sql += buildWhere(p.conditions);
    sql += " RETURNING " + (p.returning || "*");

    return sql + ";";
}