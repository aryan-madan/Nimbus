export function expected(a: number, b: number): number {
    return 1 / (1 + Math.pow(10, (b - a) / 400));
}

export function update(rating: number, exp: number, score: number, k = 32): number {
    return Math.round(rating + k * (score - exp));
}