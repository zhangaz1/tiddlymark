export function workerFrom(label: string): string {
  switch (label) {
    case 'html':
      return 'html';
    case 'json':
      return 'json';
    case 'javascript':
    case 'typescript':
      return 'typescript';
    case 'css':
    case 'scss':
    case 'less':
      return 'css';
    default:
      return 'editor';
  }
}

export function langFrom(type: string): string {
  // with worker
  switch (type) {
    case 'text/html':
      return 'html';
    case 'application/json':
      return 'json';
    case 'application/javascript':
    case 'application/typescript':
      return 'typescript';
    case 'text/css':
    case 'text/scss':
    case 'text/less':
      return 'css';
  }
  // just syntax highlighting
  switch (type) {
    case 'image/svg+xml':
      return 'xml';
    case 'text/markdown':
    case 'text/x-markdown':
      return 'markdown';
  }
  return type;
}

function parse(
  type: string,
  value: string | number | boolean | $AnyFixMe = ''
): $AnyFixMe {
  const [name, args = ''] = type.split(':');
  const options = args.split(',').filter(f => !!f);
  switch (name) {
    case 'boolean':
      return typeof value === 'string'
        ? value.toLowerCase() === 'true'
        : value === true;
    case 'enum':
      if (options.includes(value)) {
        return value;
      }
    case 'string':
      return value || null;
    case 'number':
      return typeof value !== 'number'
        ? value === '' || isNaN(+value)
          ? null
          : +value
        : value;
    case 'application/json':
    case 'json':
      return JSON.parse(value || 'null');
    case 'enum[]':
    case 'boolean[]':
    case 'string[]':
    case 'number[]':
    case 'string[]':
      const parsed = JSON.parse(value || '[]');
      if (Array.isArray(parsed) && type !== 'json') {
        const itemType = type.slice(0, -2);
        return parsed.map(i => parse(itemType, i));
      }
  }
  return null;
}

export function set(
  obj: Record<string, any>,
  key: string,
  value: $AnyFixMe
): Record<string, any> {
  return key.split('.').reduce((o, k, i, a) => {
    const last = i === a.length - 1;
    o[k] = last ? value : o[k] || {};
    return last ? obj : o[k];
  }, obj);
}

export function parseConfig(ns: string, wiki: Wiki): object {
  const filter = `[all[shadows+tiddlers]prefix[$:/config/${ns}/]]`;
  const filtered = wiki.filterTiddlers(filter);
  return filtered.reduce((a, title: string) => {
    const tiddler = wiki.getTiddler(title);
    const { type, text } = tiddler.fields;
    const option = title.replace(`$:/config/${ns}/`, '').replace(/\//g, '.');
    const value = parse(type, typeof text === 'string' ? text.trim() : text);
    return option && value !== null ? set(a, option, value) : a;
  }, {});
}
