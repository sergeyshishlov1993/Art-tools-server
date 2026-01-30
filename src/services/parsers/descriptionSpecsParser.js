// src/services/parsers/descriptionSpecsParser.js

const SECTION_TITLES = [
    'Технічні характеристики',
    'Технические характеристики',
    'Характеристики',
    'Основні характеристики',
    'Технические данные',
    'Технічні дані'
];

const KEY_BLACKLIST_SUBSTRINGS = [
    'Інструкц',
    'Инструкц',
    'Комплектац',
    'Комплект',
    'Гаранті',
    'Гарант',
    'Гарантия',
    'Кейс',
    'Упаковк',
    'Пакован',
    'Пакуван',
    'Країна',
    'Страна',
    'Виробник',
    'Производитель',
    'Бренд',
    'Артикул',
    'Код',
    'SKU',
    'EAN',
    'Штрих',
    'Серія',
    'Серия',
    'Опис',
    'Описание',
    'Посилання',
    'Ссылка',
    'Відео',
    'Видео',
    'Фото',
    'Сайт'
];

const VALUE_BLACKLIST_SUBSTRINGS = [
    'http://',
    'https://',
    'www.',
    'iframe',
    '<iframe',
    'youtube',
    'youtu.be'
];

function decodeHtmlEntitiesBasic(value) {
    const raw = String(value ?? '');
    return raw
        .replace(/&nbsp;/g, ' ')
        .replace(/&middot;/g, '·')
        .replace(/&mdash;/g, '—')
        .replace(/&ndash;/g, '–')
        .replace(/&rsquo;/g, "'")
        .replace(/&lsquo;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&apos;/g, "'")
        .replace(/&#39;/g, "'")
        .replace(/&#34;/g, '"')
        .replace(/&#(\d+);/g, (m, n) => {
            const codePoint = Number(n);
            if (!Number.isFinite(codePoint)) return m;
            if (codePoint < 0 || codePoint > 0x10ffff) return m;
            try {
                return String.fromCodePoint(codePoint);
            } catch {
                return m;
            }
        });
}

function stripTags(html) {
    const withoutTags = String(html ?? '').replace(/<[^>]+>/g, ' ');
    return decodeHtmlEntitiesBasic(withoutTags).replace(/\s+/g, ' ').trim();
}

function normalizeKey(key) {
    return String(key ?? '').replace(/\s+/g, ' ').trim();
}

function normalizeValue(value) {
    const v = String(value ?? '').replace(/\s+/g, ' ').trim();
    return decodeHtmlEntitiesBasic(v).replace(/\s+/g, ' ').trim();
}

function containsAnySubstringCaseInsensitive(text, substrings) {
    const t = String(text ?? '').toLowerCase();
    for (const substring of substrings) {
        const s = String(substring).toLowerCase();
        if (s && t.includes(s)) return true;
    }
    return false;
}

function isGarbageKey(key) {
    const k = normalizeKey(key);
    if (!k) return true;
    if (k.length > 120) return true;
    return containsAnySubstringCaseInsensitive(k, KEY_BLACKLIST_SUBSTRINGS);
}

function isGarbageValue(value) {
    const v = normalizeValue(value);
    if (!v) return true;
    if (v.length > 255) return true;
    if (/^\d{18,}$/.test(v)) return true;
    if (containsAnySubstringCaseInsensitive(v, VALUE_BLACKLIST_SUBSTRINGS)) return true;
    return false;
}

function splitKeyValue(line) {
    const text = stripTags(line);
    const separators = [':', '—', '–', '-'];
    for (const separator of separators) {
        const index = text.indexOf(separator);
        if (index <= 0) continue;
        const left = normalizeKey(text.slice(0, index));
        const right = normalizeValue(text.slice(index + 1));
        if (!left || !right) continue;
        return { name: left, value: right };
    }
    return null;
}

function findSectionBounds(html) {
    const source = String(html ?? '');
    const lower = source.toLowerCase();

    const titleHits = [];
    for (const title of SECTION_TITLES) {
        const titleLower = title.toLowerCase();
        let fromIndex = 0;
        while (true) {
            const idx = lower.indexOf(titleLower, fromIndex);
            if (idx === -1) break;
            titleHits.push(idx);
            fromIndex = idx + titleLower.length;
        }
    }

    if (titleHits.length === 0) return null;

    const startIndex = Math.min(...titleHits);

    const afterStart = source.slice(startIndex);
    const endCandidates = [];

    const nextHeaderMatch = afterStart.match(/<h[1-6][^>]*>/i);
    if (nextHeaderMatch && nextHeaderMatch.index !== undefined) {
        const headerStart = startIndex + nextHeaderMatch.index;
        if (headerStart > startIndex) endCandidates.push(headerStart);
    }

    const nextHrMatch = afterStart.match(/<hr\b[^>]*>/i);
    if (nextHrMatch && nextHrMatch.index !== undefined) {
        const hrIndex = startIndex + nextHrMatch.index;
        if (hrIndex > startIndex) endCandidates.push(hrIndex);
    }

    const endIndex = endCandidates.length > 0 ? Math.min(...endCandidates) : source.length;

    if (endIndex <= startIndex) return null;
    return { startIndex, endIndex };
}

function extractListItems(html) {
    const items = [];
    const liRegex = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;

    let match = null;
    while ((match = liRegex.exec(html)) !== null) {
        const raw = String(match[1] ?? '').trim();
        if (!raw) continue;
        items.push(raw);
    }

    return items;
}

function extractTableRows(html) {
    const rows = [];
    const trRegex = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;

    let trMatch = null;
    while ((trMatch = trRegex.exec(html)) !== null) {
        const trContent = String(trMatch[1] ?? '');
        const tdMatches = Array.from(trContent.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi));
        if (tdMatches.length < 2) continue;

        const keyCell = tdMatches[0] ? tdMatches[0][1] : '';
        const valueCell = tdMatches[1] ? tdMatches[1][1] : '';
        const name = stripTags(keyCell);
        const value = stripTags(valueCell);

        if (!name || !value) continue;
        rows.push({ name, value });
    }

    return rows;
}

function mergeStrongValueFallback(liHtml) {
    const cleaned = String(liHtml ?? '');

    const strongMatch = cleaned.match(/<strong\b[^>]*>([\s\S]*?)<\/strong>/i);
    if (!strongMatch) return null;

    const strongValue = stripTags(strongMatch[1]);
    if (!strongValue) return null;

    const beforeStrong = cleaned.slice(0, strongMatch.index ?? 0);
    const candidate = stripTags(beforeStrong);

    const separators = [':', '—', '–', '-'];
    for (const separator of separators) {
        const index = candidate.lastIndexOf(separator);
        if (index <= 0) continue;
        const left = normalizeKey(candidate.slice(0, index));
        const right = normalizeValue(strongValue);
        if (!left || !right) continue;
        return { name: left, value: right };
    }

    return null;
}

function dedupeByKey(pairs) {
    const map = new Map();
    for (const pair of pairs) {
        const name = normalizeKey(pair.name);
        const value = normalizeValue(pair.value);
        if (!name || !value) continue;
        map.set(name.toLowerCase(), { name, value });
    }
    return Array.from(map.values());
}

function parseDescriptionSpecs(descriptionHtml) {
    const html = String(descriptionHtml ?? '');
    if (!html) return [];

    const bounds = findSectionBounds(html);
    const scopeHtml = bounds ? html.slice(bounds.startIndex, bounds.endIndex) : html;

    const results = [];

    const listItems = extractListItems(scopeHtml);
    for (const liHtml of listItems) {
        const direct = splitKeyValue(liHtml);
        if (direct && !isGarbageKey(direct.name) && !isGarbageValue(direct.value)) {
            results.push(direct);
            continue;
        }

        const strongBased = mergeStrongValueFallback(liHtml);
        if (strongBased && !isGarbageKey(strongBased.name) && !isGarbageValue(strongBased.value)) {
            results.push(strongBased);
            continue;
        }
    }

    const tableRows = extractTableRows(scopeHtml);
    for (const row of tableRows) {
        const name = normalizeKey(row.name);
        const value = normalizeValue(row.value);
        if (isGarbageKey(name)) continue;
        if (isGarbageValue(value)) continue;
        results.push({ name, value });
    }

    return dedupeByKey(results);
}

module.exports = {
    parseDescriptionSpecs
};