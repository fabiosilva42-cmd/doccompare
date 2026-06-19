export type ExportFieldDef = {
  key: string;
  label: string;
  defaultSelected?: boolean;
};

export function pickExportRows(
  rows: Record<string, string | number | null | undefined>[],
  selectedKeys: string[]
) {
  return rows.map((row) => {
    const out: Record<string, string | number | null | undefined> = {};
    for (const key of selectedKeys) {
      if (key in row) out[key] = row[key];
    }
    return out;
  });
}

export function defaultSelectedKeys(fields: ExportFieldDef[]) {
  return fields.filter((f) => f.defaultSelected !== false).map((f) => f.key);
}
