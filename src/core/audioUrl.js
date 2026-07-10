const BASE = import.meta.env.BASE_URL
export const audioUrl = (src) => src?.startsWith('/') ? BASE + src.slice(1) : src
