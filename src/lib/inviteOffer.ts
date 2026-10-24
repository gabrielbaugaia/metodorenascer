/** A oferta aparece somente entre o início da janela definida pelo admin e o fim do acesso. */
export function isInOfferWindow(offerStartsAt: string, expiresAt: string, now: Date): boolean {
  const t = now.getTime();
  return t >= new Date(offerStartsAt).getTime() && t < new Date(expiresAt).getTime();
}
