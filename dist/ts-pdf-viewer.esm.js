import { renderTextLayer, RenderingCancelledException, GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import { inflate } from 'pako';

var img = "data:image/png;base64,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";

var img$1 = "data:image/png;base64,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";

var img$2 = "data:image/png;base64,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";

var img$3 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAABcWlDQ1BpY2MAACiRdZG9S8NQFMVPW8Wi1Q46SHHIUMWhhaIgjlLBLtWhrWDVJXlN2kKShpcUKa6Ci0PBQXTxa/A/0FVwVRAERRBx8R/wa5ES72sKLdLe8PJ+nHfP5eUE8Kd1Zth9CcAwHZ5JJaW1/Lo08A4fRhBEHBGZ2dZydimHnvXzSN1UD3Exq3df1xoqqDYDfEHiOWZxh3iBOL3lWIL3iMdYSS4QnxDHOF2Q+Fboisdvgosefwnmucwi4BczpWIHKx3MStwgniaOGnqVte4jviSkmqtZ2iO0JmAjgxSSkKCgijJ0OJRLGSZl1t2XaPpWUCEPo7eFGjg5iiiRN0ZqlaaqtGukq/ToqInc/+dpa7Mz3vRQEuh/dd3PSWBgH2jUXff31HUbZ0DgBbg22/4K5TT/TXq9rUWPgfAOcHnT1pQD4GoXGH+2ZC43pQAtv6YBHxfAcB4YvQcGN7ysWuc4fwJy2/SL7oDDI2CK+sObf/JNaAQfxWcoAAAACXBIWXMAAAsTAAALEwEAmpwYAAAIPUlEQVR42uVbW2wUVRg+c/ZSUrelsxfaGkQNDVgfJKgJAuVNg1yDER5ICPrSigJWQU1INCYmJEokQLEQIPHKgwYSULABeQPEJijwRiPXYKK07uz2Kt3uzhy/f90uM2dnt6XdbXfH87LbmdOZ83///bIKK/AKhUI1uq4vFIoyRzBWrxjG44LzanxOUzj30h5DiDhTlC5c68S9WwpjVxUhrnDOL4TD4b8KeT6lEA/1+/3z8LHaUJSlnLEn7fYYhsFAYMZ3m30duNcmDONoNBptxyVRlACA6EpwuREHbcKBZxUCWDz7GpA6CFQOAYyeogBAVdWpONRWsKUZPKxkE7AgFX1QnxYjkdjZ09MTnSwAFDUYbISubsf3YK7zgnNXANJZfO+AlHSIePwO7EJff01NH23w3b1b4XK5KhSPZwYONJsJUQ8qG0DkXNx25Xi2ZjD2QbemHaD3TBgAlaHQTLdhfImvDVm2JEDEKSHEN+DWmbFyaerUqVUA5gU8Zx3AWIJLnixbf+GK8goM5rWCAwCurxW6fhB67rO5HYUqtMRjsc/6+/vD+RR7n88X9Hq9b8BbNJPJsVGLAUjZBkjD4UIBwGHoPsEB3rF5+T1w4GNFUXZpmtZXYLfqg/q8Bde5DUwozzCUjO2OatrW0arEaAHw+gMBQnZNpmkWbTjQJoj5LTaBq6qq6lEAsBcMWWEDwrGoqq5l16/H8gGAF5w/hhctla4Pgfh3I5FIC5vEFQgENsJG7MT5yqRbpyKqumokEEYCQAHnv5M5D5G/6+J8BcT91zHHDYGAJaCJaNqYPVIwGHw6oesnIBEPS3HDccQLL+dSBz5CcLNDJh4PvS48noXjIT7fC9b/Es61EIz53cI9zlepgcCunIYtl7WXDR4R7/F4Gnq6um6yIluwQbfLvN5FGSAw9iYYuf6BACA/D1d3QBZ7w+NZ3NXV1cmKdHV2dnaBSYtx1j+tkZjYDzWZNVoAFApyoE8VZoMHnV9ZjJy3kwThci2HgU4bP3KXCSG+tqOX24h+Y0aEB2sPnb/ISmT1hMOXkYm+LRE6Dx7j9ZxegBIbBDPXoPshs5+Hq1uW95Q5j14gR6L2PQzhSvNr9ESizhyaWyUAWZ2ZeIrwKMhhpbs2g4Z/zLgjt3jPVgWS+TxSWstNhLcTHeHlcyEGuAMatksGcRMlWRkAUDFDyuejFNuzEl9w23sobTYZRB93u5syATCMJimebil0YjNBrnEAdmy3xfAJ0TRs//hwDU8qY8UppWUOWfF4fH8yd0kjoMyEgVxgloDVkts7le98fjJXX1+fBglvkwz+mjQAhpTpIbs6zBy2YM8OS0WMpGvnVLeXStcGlbGY8xbRpJsSpTqo/nROTQsp4bk83kprMS4Ec73IiX+TLs/n1LGRdOMcc+iCpJ+3MFtR5nJqV0n7OpwKAKT7qmQH6jn16iRUHAuAzFwYxsc4NSotAMTjdxwrAUL8IYXF1W6IgcpMjUnq2Iwmeyt0djhuo2eTXVJLjbtcZgnwIwDkU8ybhttVTly9vb39kkSUcfY/XxxiYambU6PSqcRWVlb6JCOYcEP/KehJt5ioS4uP8Gh0qtgrQhncttY5SQX+JjdoqfJSi9qpEgCOPyIVfDrJDVoqPsn+vHMBmC1JwG1OA0mSs6x3sM2rlwDp4DSNJTnLRU6lHml/gyQBlykOuGBBhfO55qKhU1YgEKiAz39GutzOaQ6PRtHMtoHGUhwYBhNNbtOFG8mqcco9tEmb1zkOAEVZJ/39YypFTqaJRyU1WEIzOQ4KgPww9sskAI6mAaAJzOQQ4v3lSQ4kOWS53W7qCXpNIn6zOxw+nwaALiUnMK0+opkGkkqd+NraWopymyXuH2SpkVtucn+HKF00R6s0jVXqAAwODW2W+p0DRiKRZnYaAJq9pfFTqWCwDS7xsVIlnqq+UO33pfC3NWt3GMh8yqx9tHK4xL0lbPlbpIHO7ng8vsMCiPkPINNNs7eSLVhOo2ilRrwaDDbB8r8kBQMfUpdIyn0ys0akqmQh55v+MQYkF9A0Vimkw1Wh0ByWSLSbq13Q/Yvd0SjRpGeVgOG9NHicnL29LwVlCV0/WQr2QFXVGaD2pET8PRfn62XiswHAklPXnG+Qigm1MJKnq6urpxUr8b6amhDE6jSImi4Zvk2aptmW+7PWBGnqmgaPJRBmxYaGzhWjJBDn3bHYWZzxCYvaG0ZrJBL5PGuVKNdDaeqaBo9lECAJP9N4arEQTzovcCaZeNiuE3DvzTmLJCM+va6uzB+NHse3F6WHx5Bfb4Gk7Jtsay90fY9c3oc3+6lbVVeOd1g6DYKqad/S7G2GrzWMH/CxmVLLCQ9y4OczXF2K8xG/f81oxuVdo3pbJKIPDg4emVJeruKF86Sy0mykz6+Vl5dT1nVpYGAgXujY3lNWtgXvPALj9pQNQ1rBjFdx5lGdQxkD8usRIu+DyD1kc1ujgSSayZEDjnyktMjqNrD/JkAzUvXUr1Y2wuB98SDPHVPwQYPHCSG+ggV9LsuWIZrJSY2lnKHhhDGKOY3tPU/FjFQ+77XbR0EO+flsri7vAAw7BJq9hZf4iNn8iMm0dJrMoOGEVH++g7q0lHkO9+qoY0NNC6rbp0rX9VTAxP88O4KadlN4C4Bb7YKcQgOQXIgJVBo/pQnMLL8ky/uiKJWyOkpsxqtqeYu/qZKcnMA0jEYaQCpMeiduUjGD8vl8zTEVoh+nJIcQaQ7PMJaNGwwhblABk2p4qTJWcf54Ope/psySBpJoJofGUmgyA58h2AJ3ypXG8D1CvTpqV1HHhpoWuNVe6PjiX7rk5GR8PE/UAAAAAElFTkSuQmCC";

var img$4 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAABcWlDQ1BpY2MAACiRdZG9S8NQFMVPW8Wi1Q46SHHIUMWhhaIgjlLBLtWhrWDVJXlN2kKShpcUKa6Ci0PBQXTxa/A/0FVwVRAERRBx8R/wa5ES72sKLdLe8PJ+nHfP5eUE8Kd1Zth9CcAwHZ5JJaW1/Lo08A4fRhBEHBGZ2dZydimHnvXzSN1UD3Exq3df1xoqqDYDfEHiOWZxh3iBOL3lWIL3iMdYSS4QnxDHOF2Q+Fboisdvgosefwnmucwi4BczpWIHKx3MStwgniaOGnqVte4jviSkmqtZ2iO0JmAjgxSSkKCgijJ0OJRLGSZl1t2XaPpWUCEPo7eFGjg5iiiRN0ZqlaaqtGukq/ToqInc/+dpa7Mz3vRQEuh/dd3PSWBgH2jUXff31HUbZ0DgBbg22/4K5TT/TXq9rUWPgfAOcHnT1pQD4GoXGH+2ZC43pQAtv6YBHxfAcB4YvQcGN7ysWuc4fwJy2/SL7oDDI2CK+sObf/JNaAQfxWcoAAAACXBIWXMAAAsTAAALEwEAmpwYAAAB+0lEQVR42u2bMW/EIAyFA7qla5Ol///HdUm6dguFKlQuBwnh7ADKs5TlTsrxPp6NAZ16H0czCMTXsijO90mNUw83DwC4OwAV5hZ37rYWoV6kAAAAAAAAAAAAAAAAAAAAAADcMh6CO63F7iwnkR2cUmqe57YcEIq3zyg4cWaapnYARM7rRjtLYupXY9ggaAHxzqKDtSgbAXdIkwBqqgK4QryP8J3OBe6xLjBVAFwpnjoh9rmDUJoOuhfxqXTwTiitCbon8WE6ROrCaQi6N/GxdFjX9XtzwWkIukS8/cHPmuKfnKD1W6kTdMnM2x/8qC0+VhNIPciGoEts7+nb75ro53cm4nCJ3L0ZkrqRvWSXRwokBZR9M9SzeJoOR82SziHYe5C6kA/A2cZB8E/PsXfh+zgqLt4+DgIl2cotsivEdizJlD0aZ84ymOy/G5nd5FhyJukQwHby8td60jW3hULpxP8Wu605O+vQrEaIQqDtZ20nePG+OStJz+xW+MkJpP2s4QQqvmTmizZDUSdsg7jSCVzii7bDHkK4PF5VEzjFFx+IOAip/lsSArf4YgCxZkl6iZQQ/zKAVJ/AnQ5S4lkA0Jog3Msv3OK5HBBdHZjj300TZxvOdjcoCYHrjlHMAT0HAAAAAAAAAAAAAAAAAAAAANwzFP47jBQAgFvHDyRnPtj60cBDAAAAAElFTkSuQmCC";

var img$5 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAABcWlDQ1BpY2MAACiRdZG9S8NQFMVPW8Wi1Q46SHHIUMWhhaIgjlLBLtWhrWDVJXlN2kKShpcUKa6Ci0PBQXTxa/A/0FVwVRAERRBx8R/wa5ES72sKLdLe8PJ+nHfP5eUE8Kd1Zth9CcAwHZ5JJaW1/Lo08A4fRhBEHBGZ2dZydimHnvXzSN1UD3Exq3df1xoqqDYDfEHiOWZxh3iBOL3lWIL3iMdYSS4QnxDHOF2Q+Fboisdvgosefwnmucwi4BczpWIHKx3MStwgniaOGnqVte4jviSkmqtZ2iO0JmAjgxSSkKCgijJ0OJRLGSZl1t2XaPpWUCEPo7eFGjg5iiiRN0ZqlaaqtGukq/ToqInc/+dpa7Mz3vRQEuh/dd3PSWBgH2jUXff31HUbZ0DgBbg22/4K5TT/TXq9rUWPgfAOcHnT1pQD4GoXGH+2ZC43pQAtv6YBHxfAcB4YvQcGN7ysWuc4fwJy2/SL7oDDI2CK+sObf/JNaAQfxWcoAAAACXBIWXMAAAsTAAALEwEAmpwYAAAB30lEQVR42u2bzXKDIBCAw+ql6cnqpQ/Q93+f9gF60aan9GKwmkqHsXZA5Wd3YWcyySFO+D4WCLKKU+R4qush5u/DKfHIAlIXIFIDXs45eQhkAYlHiaUhTdMMcvgZniDcTE397Xb9vFweKQgoFfwU+ue1kFJ+AcDDf6J+RQKcqWRAv+cikyhqc4Ax71WPT73Pbg746Lpd/0uO7iVIrwIuNlJkBIyrhJddJBkBbdt62UIDp7Qf5xExL5PvLAXYwM+rxDM7AbbwLIeAL3gSAnzCoxfgGx61gBDwaAWEgkcpICQ8OgGh4VEJiAGPRkAseBQCPMF3JAQo+LV7e3vh9esGKd9M3xeppT2Kk6GYY/5PBiwb47sBmOCDZwA2eCsBVVW9Tg0fX63TsadNfLHgrQQIgBebHtza8+pQIyb81iFQc0n7YHMAdnivAijAexNABd6LAErwzgVQg3cqgCK8MwFU4Z0IoAx/WAB1+EMCOMBvEqAfOXOB3yRAHTlzgne6DOrwy3IW9gKWPa+Xs7AXQDHt9ThcJ7h2p8eiglPMdYF85oCpfvf+ble+OpDMAFNx8o7f7tELGHv2WhbF2SQGisJYv7soh+9JZICp3p565EdmsoDEQ8R+dpfSwUgeAlkAw/gGgdL3j4c6UpkAAAAASUVORK5CYII=";

var img$6 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAABcmlDQ1BpY2MAACiRdZE9S8NQFIbftkpFWwrqIOKQoYpCC0VBHKWCXapDW8GqS3KbtEKShpsUKa6Ci0PBQXTxa/Af6Cq4KgiCIoi4+Af8WqTEc5tCi7Qn3JyH9573cO+5gD+tM8PuSQCG6fBMKimt5tek4Dt8GEQYQ5iSmW0tZRdz6Bo/j1RN8RAXvbrXdYyBgmozwNdHPMss7hDPE6e3HEvwHvEwK8kF4hPiGKcDEt8KXfH4TXDR4y/BPJdZAPyip1RsY6WNWYkbxJPEUUOvsOZ5xE1CqrmSpTxKaww2MkghCQkKKtiEDgdxyibNrLMv0fAto0weRn8LVXByFFEib4zUCnVVKWukq/TpqIq5/5+nrc1Me91DSaD31XU/x4HgPlCvue7vqevWz4DAC3BttvxlmtPcN+m1lhY9BiI7wOVNS1MOgKtdYOTZkrnckAK0/JoGfFwA4TwwdA/0r3uzau7j/AnIbdMT3QGHR8AE1Uc2/gDt82gCvNGYhAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAcpJREFUeNrtWwFuwyAMjBEPWNf8/4XpugesoWMKUppBYidQ5cAnVZWaRtGdDxscoC6Bvu9d7PfRue6sMETJa8MwRC8Slzi6ACkhiEu8FgGWQpiucdBW9FNj5wiWzyvxjOk5/muVm30n8Xfjl8NfkNeEMLHo10Cem/CbyAHeCZMb/sGePfqTfXfh5/Hovu/3F25Lx9ujiURad6WIld1xHDtjTLLshXv8f7Zgka2dY04ClQNCxDmR5eL0Dvi63Vavf16vh1xjzzy13YKUPPQQWFaDHOShBJjX8VzkIRdDa+RDvvBlskoBOOSlVcLURr7KIVCKPIQAJclDJsGc5FkzwdBUqJE8pANykocTIDd59mKI2zIv0Q8oSR7GAaXIQwhQkjx0GVQBGI5xjEWRrTGqkmGjQ0AFUAFUABVABVAB2sXmRMi3pEbnSDLJyNm3h3MAEvnsAqCRZw0Bb/l5Q2THjg1qaghoFVABVAAVQAVQAVQAFUCCI9thxYSJXj5WcspCHaACNNgP+LhcTr+gySqAX/nNX2nP99ujI/aaX3NAbAPDkQ0RSNFfPTUWbkA/QLUVTNoT9RpOj+rJ0aUDJE5AdkDy8LRECEQBUrnsCeUexwK5uUFRAAAAAElFTkSuQmCC";

var img$7 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAABcWlDQ1BpY2MAACiRdZE9S8NQFIbfpkpFqx3qIMUhQxWHFoqCOEoFu1SHtoJVl+Q2aYQkDUmKFFfBxaHgILr4NfgPdBVcFQRBEURc/AN+LVLiuU2hRdoTbs7De897uPdcQMjqzHD6UoBhunYukxZXi2ti6B0BxDACAVGJOdZSfrGAnvHzSNUUD0neq3dd1xgqKQ4DAgPEs8yyXeJ54uyWa3HeIx5lmlQiPiFO2HRA4luuyz6/cS77/MXZLuQWAIH3FMsdLHcw02yDeIo4buhV1joPv0lYMVfylGO0xuEghwzSECGjik3ocJGkbNLMuvtSTd8yKuRh9LdQg02OMjTyJkitUleFskq6Qp+OGp/7/3k66sy03z2cBvpfPe9zAgjtA4265/2eel7jDAi+ANdm21+hOc19k15va/FjILIDXN60NfkAuNoFxp4tyZaaUpCWoKrAxwUwXASi98Dguj+r1j7On4DCNj3RHXB4BExSfWTjD603Z+Sp2ztrAAAACXBIWXMAAAsTAAALEwEAmpwYAAADGklEQVR42uVbC47jIAytESeY6f1P2NkjLCOqInmoP5g4BChSpLZJAT8/G9sQuDHtfr+Tv/9P6WZp/35+tP6lDsEyXgBg7z0eD3qAVsE9AWgU/s8cOQG+vr+bAOCAiK2Cn9CS4TnwGrTIWYAItw9voGmfo56DJlI1DnD38jx75qGxOvcZRwuuCV++V888zaCmLyUkvlc+S0BE6uZBtBMDKHjYbvnMzVG6Rz0bvbSaByWo+0frR0GQWCSZicSE0Kv93Fm5mAl10V/4PSkrSGpRkgrAUXoatWbq8yVA8ujfFQBOg56UbxXQCoIXACytvUHwBjkepffL+Q0PYGqQseaxw5WWyScDcmyPr6uEYOzdnT3YcTcxwMsBtsTlXv1aVoJwpv0bNH16tDl8FThTmwygXeYSBtn61YAmLn6YlgFW0Bg/UgueatMYWQ+AWRiFQZjSBOql6kwneWlF6MyaA8E+6EqHtUleEQUeMD2ofcJH1QRPS4cno7tp/NjoMGbSIljpL4EfPo3ybwzAOzd5aRC0DSOTllEgBEPykBSAlmzBkjkhILyWJLb2Vy7qP54heW89oGu/rgiEKskiRdGETyurBUr7L08L0sA9FdhpTYBaZopmpMKjBwjO+5KiuVD9xVYPSuzXTRdAtdQRc90TnyMIBxBetuHib+jQxjYgPNnQ68m3igOsjm0nEALl4Q2BzvIgRC3Qwaewciu5A9pzr4sM65nAQRYszYioxPzqQUXsDzJbOMZMDwAX6GQB6vM522WDStKzdYt1HlCzQNrBXZEROAxuDYS2YUGtrAwGmw1+SmsNhdMm2n87Wxha1/PdvH/xa8GQg69eEL3ufMBszg+zPBjD2jRwgmfavv7CxC7rvqbcgA89E4cKYQNfkCTlDt0XmGDZezNt1QmuGBgJwvNvjeE/t5Siy3ncq/f9LcJTrA1Wp7GAQ2SFJ0+ItGx5C0XQNJPmhYIuiG+Otm5P9QzQypwjpmSlPR4TNDoTr6iRA40+ak/l95QD1+RaemdIE96UDqMDCUuBYBW+lhM0O1VC4nQl/SkW1MJrcvwCJhH28gf87HUAAAAASUVORK5CYII=";

const styles = `
  <style>
    :host {
      --color-primary-final: var(--color-primary, rgba(40,40,40,1));
      --color-primary-tr-final: var(--color-primary-tr, rgba(40,40,40,0.9));
      --color-secondary-final: var(--color-secondary, rgba(60,60,60,1));
      --color-secondary-tr-final: var(--color-secondary-tr, rgba(60,60,60,0.9));
      --color-accent-final: var(--color-accent, rgba(96,96,96,1));
      --color-shadow-final: var(--color-shadow, rgba(0,0,0,0.75));
      --color-bg-final: var(--color-bg, rgba(128,128,128,1));
      --color-fg-primary-final: var(--color-fg-primary, rgba(255,255,255,1));
      --color-fg-secondary-final: var(--color-fg-secondary, rgba(187,187,187,1));
      --color-fg-accent-final: var(--color-fg-accent, rgba(255,255,255,1));
      --color-text-selection-final: var(--color-text-selection, rgba(104,104,128,0.3));
    }

    .disabled {
      pointer-events: none;
    }

    .absolute {
      position: absolute;
    }
    .abs-stretch {
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
    }
    .abs-topleft {
      position: absolute;
      left: 0;
      top: 0;
    }

    #main-container {
      box-sizing: border-box;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: stretch;
      align-items: stretch;
      width: 100%;
      height: 100%;
      background: var(--color-bg-final);
    }
  
    #panel-top {
      position: relative;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
      width: 100%;
      height: 50px;
      background: var(--color-primary-final);
      box-shadow: 0 0 10px var(--color-shadow-final);
      z-index: 1;
      transition: height 0.25s ease-out 0.1s;
    }
    .hide-panels #panel-top {
      height: 0;
      transition: height 0.25s ease-in 0.2s;
    }
  
    #panel-bottom {
      position: absolute;
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      flex-grow: 0;
      flex-shrink: 0;
      left: calc(50% - 160px);
      bottom: 20px;
      width: 320px;
      height: 50px;  
      background: var(--color-primary-tr-final);
      box-shadow: 0 0 10px var(--color-shadow-final);
      z-index: 1;
      transition: height 0.25s ease-out, bottom 0.1s linear 0.25s;
    }
    .hide-panels #panel-bottom {
      bottom: 0;
      height: 0;
      transition: bottom 0.1s linear 0.1s, height 0.25s ease-in 0.2s;
    }

    .panel-v-separator {
      width: 1px;
      height: 30px;
      background-color: var(--color-fg-secondary-final);
    }
  
    .panel-button {
      cursor: pointer;
      user-select: none;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
    }
    .panel-button:hover,
    .panel-button.on {
      background-color: var(--color-accent-final);
    }
    .panel-button img {
      width: 20px;
      height: 20px;
      filter: invert() opacity(0.5) drop-shadow(0 0 0 var(--color-fg-primary-final)) saturate(1000%);
    }  
    .panel-button:hover img,
    .panel-button.on img {
      filter: invert() opacity(0.5) drop-shadow(0 0 0 var(--color-fg-accent-final)) saturate(1000%);
    }  
  
    .subpanel {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      margin: 0 4px;
    }    
    
    .panel-item {
      transform: scale(1);
      transition: opacity 0.1s ease-out 0.35s, transform 0s linear 0.35s;
    }
    .hide-panels .panel-item {
      cursor: default;      
      opacity: 0;
      transform: scale(0);
      transition: opacity 0.1s ease-in, transform 0s linear 0.1s;
    }
  
    #paginator {  
      user-select: none;
      font-family: sans-serif;
      font-size: 16px;
      color: var(--color-fg-primary-final);
    }
    #paginator-input {
      text-align: center; 
      font-size: 16px;
      width: 30px;
      height: 30px;
      margin: 2px;
      padding: 0;
      outline: none;
      border: none;
      color: var(--color-fg-primary-final);
      background-color: var(--color-primary-final);
    }
    #paginator-total {
      margin: 4px;
    }

    #toggle-previewer {
      margin: 4px;
    }
      
    #previewer {
      box-sizing: border-box;
      position: absolute;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      overflow-y: auto;
      left: 0;
      top: 50px;
      bottom: 0;
      width: 160px; 
      padding-top: 0px;
      background: var(--color-secondary-final);
      box-shadow: 0 0 10px var(--color-shadow-final);
      z-index: 1;
      transition: padding-top 0.25s ease-out 0.1s, top 0.25s ease-out 0.1s, width 0.25s ease-out;
    } 
    .hide-panels #previewer {
      top: 0;
      padding-top: 50px;
      transition: padding-top 0.25s ease-in 0.2s, top 0.25s ease-in 0.2s;
    }   
    .mobile #previewer {
      background: var(--color-secondary-tr-final);
    } 
    .hide-previewer #previewer {
      width: 0;
      transition: width 0.25s ease-in 0.1s;
    }
    #previewer .page-preview {      
      transform: scaleX(1);
      transition: opacity 0.1s ease-out 0.35s, transform 0s linear 0.35s;
    }
    .hide-previewer #previewer .page-preview {
      opacity: 0;
      transform: scaleX(0);
      transition: opacity 0.1s ease-in, transform 0s linear 0.1s;
    }
  
    #viewer {
      box-sizing: border-box;
      position: absolute;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      overflow: auto;
      left: 160px;
      right: 0;
      top: 50px;
      bottom: 0;
      padding-top: 0px;
      transition: padding-top 0.25s ease-out 0.1s, top 0.25s ease-out 0.1s, left 0.25s ease-out;
    }
    #viewer.hand {
      cursor: grab !important;
      user-select: none !important;
    }
    .hide-panels #viewer {
      top: 0;
      padding-top: 50px;
      transition: padding-top 0.25s ease-in 0.2s, top 0.25s ease-in 0.2s;
    }      
    .hide-panels.mobile #viewer,
    .hide-panels.hide-previewer #viewer {
      top: 0;
      padding-top: 50px;
      left: 0;
      transition: padding-top 0.25s ease-in 0.2s, top 0.25s ease-in 0.2s, left 0.25s ease-in;
    }   
    .mobile #viewer,
    .hide-previewer #viewer {
      top: 50px;
      padding-top: 0px;
      left: 0;
      transition: padding-top 0.25s ease-out 0.1s, top 0.25s ease-out 0.1s, left 0.25s ease-in;
    } 
  
    .page {    
      position: relative;
      display: flex;
      flex-grow: 0;
      flex-shrink: 0;
      margin: 10px auto;
      background-color: white;
      box-shadow: 0 0 10px var(--color-shadow-final);
    }
    .page-preview {   
      cursor: pointer; 
      position: relative;
      display: flex;
      flex-grow: 0;
      flex-shrink: 0;
      margin: 0 auto;
      background-color: white;
      background-clip: content-box;
      border-style: solid;
      border-width: 10px 10px 20px 10px;
      border-color: transparent;
    }
    .page-preview:hover,
    .page-preview.current {
      border-color: var(--color-accent-final);
    }
    .page-preview::after {
      display: inline-block;
      position: absolute;
      top: calc(100% + 3px);
      width: 100%;
      text-align: center;
      font-family: sans-serif;
      font-size: 14px;
      line-height: 1;
      color: var(--color-fg-primary-final);
      content: attr(data-page-number) " ";
    }

    .page-canvas {
      background-color: white;
    } 
    
    .page-text {
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      margin: 0;
      padding: 0;
      overflow: hidden;
      line-height: 1;
    }
    .page-text span {
      cursor: text;
      position: absolute;
      white-space: pre;
      color: transparent;
      transform-origin: 0% 0%;
    }
    .page-text ::selection {
      background: var(--color-text-selection-final);
    }
    .hand .page-text span {
      cursor: grab;
    }
  </style>
`;
const html = `
  <div id="main-container" class="hide-previewer">
    <div id="viewer"></div>
    <div id="previewer"></div>
    <div id="panel-top"> 
      <div class="subpanel panel-item">
        <div id="toggle-previewer" class="panel-button panel-item">
          <img src="${img$6}"/>
        </div> 
        <div id="toggle-hand" class="panel-button panel-item">
          <img src="${img$7}"/>
        </div> 
      </div>
      <div id="annotator" class="subpanel panel-item">
      </div>
    </div>
    <div id="panel-bottom" class="disabled">
      <div id="paginator" class="subpanel panel-item">
        <div id="paginator-prev" class="panel-button">
          <img src="${img}"/>
        </div>
        <div id="paginator-next" class="panel-button">
          <img src="${img$1}"/>
        </div>
        <input id="paginator-input" type="text">
        <span>&nbsp/&nbsp</span>
        <span id="paginator-total">0</span>
      </div>
      <div class="panel-v-separator panel-item"></div>
      <div id="zoomer" class="subpanel panel-item">
        <div id="zoom-out" class="panel-button">
          <img src="${img$2}"/>
        </div>
        <div id="zoom-in" class="panel-button">
          <img src="${img$3}"/>
        </div>
        <div id="zoom-fit-viewer" class="panel-button">
          <img src="${img$4}"/>
        </div>
        <div id="zoom-fit-page" class="panel-button">
          <img src="${img$5}"/>
        </div>
      </div>
    </div>
  </div>
`;

function clamp(v, min, max) {
    return Math.max(min, Math.min(v, max));
}
function getDistance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}
function getCenter(x1, y1, x2, y2) {
    return {
        x: (x2 + x1) / 2,
        y: (y2 + y1) / 2,
    };
}

var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class ViewPageText {
    constructor(pageProxy) {
        this.onMouseDown = (e) => {
            var _a;
            if (this._divModeTimer) {
                clearTimeout(this._divModeTimer);
                this._divModeTimer = null;
            }
            (_a = this._renderTask) === null || _a === void 0 ? void 0 : _a.expandTextDivs(true);
        };
        this.onMouseUp = (e) => {
            this._divModeTimer = setTimeout(() => {
                var _a;
                (_a = this._renderTask) === null || _a === void 0 ? void 0 : _a.expandTextDivs(false);
                this._divModeTimer = null;
            }, 300);
        };
        if (!pageProxy) {
            throw new Error("Page proxy is not defined");
        }
        this._pageProxy = pageProxy;
        this._container = document.createElement("div");
        this._container.classList.add("page-text");
        this._container.addEventListener("mousedown", this.onMouseDown);
        this._container.addEventListener("mouseup", this.onMouseUp);
    }
    static appendPageTextAsync(pageProxy, parent, scale) {
        return __awaiter(this, void 0, void 0, function* () {
            const textObj = new ViewPageText(pageProxy);
            yield textObj.renderTextLayerAsync(scale);
            parent.append(textObj._container);
            return textObj;
        });
    }
    destroy() {
        this.destroyRenderTask();
        if (this._container) {
            this._container.remove();
            this._container = null;
        }
    }
    renderTextLayerAsync(scale) {
        return __awaiter(this, void 0, void 0, function* () {
            this.clear();
            this.destroyRenderTask();
            const viewport = this._pageProxy.getViewport({ scale });
            const textContentStream = this._pageProxy.streamTextContent();
            this._renderTask = renderTextLayer({
                container: this._container,
                textContentStream,
                viewport,
                enhanceTextSelection: true,
            });
            try {
                yield this._renderTask.promise;
            }
            catch (error) {
                if (error.message === "TextLayer task cancelled.") {
                    return false;
                }
                else {
                    throw error;
                }
            }
            return true;
        });
    }
    clear() {
        this._container.innerHTML = "";
    }
    destroyRenderTask() {
        if (this._renderTask) {
            this._renderTask.cancel();
            this._renderTask = null;
        }
    }
}

var __awaiter$1 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class ViewPage {
    constructor(pageProxy, maxScale, previewWidth) {
        if (!pageProxy) {
            throw new Error("Page proxy is not defined");
        }
        this._pageProxy = pageProxy;
        this._viewport = pageProxy.getViewport({ scale: 1 });
        this._maxScale = Math.max(maxScale, 1);
        const { width, height } = this._viewport;
        previewWidth = Math.max(previewWidth !== null && previewWidth !== void 0 ? previewWidth : 0, 50);
        const previewHeight = previewWidth * (height / width);
        this._dimensions = { width, height, previewWidth, previewHeight };
        this._previewContainer = document.createElement("div");
        this._previewContainer.classList.add("page-preview");
        this._previewContainer.setAttribute("data-page-number", pageProxy.pageNumber + "");
        this._previewContainer.style.width = this._dimensions.previewWidth + "px";
        this._previewContainer.style.height = this._dimensions.previewHeight + "px";
        this._viewContainer = document.createElement("div");
        this._viewContainer.classList.add("page");
        this._viewContainer.setAttribute("data-page-number", pageProxy.pageNumber + "");
        this.scale = 1;
    }
    get previewContainer() {
        return this._previewContainer;
    }
    get viewContainer() {
        return this._viewContainer;
    }
    set _viewRendered(value) {
        this.$viewRendered = value;
        this._viewContainer.setAttribute("data-loaded", value + "");
    }
    get _viewRendered() {
        return this.$viewRendered;
    }
    set scale(value) {
        if (value <= 0 || this._scale === value) {
            return;
        }
        this._scale = value;
        const dpr = window.devicePixelRatio;
        this._dimensions.scaledWidth = this._dimensions.width * this._scale;
        this._dimensions.scaledHeight = this._dimensions.height * this._scale;
        this._dimensions.scaledDprWidth = this._dimensions.scaledWidth * dpr;
        this._dimensions.scaledDprHeight = this._dimensions.scaledHeight * dpr;
        this._viewContainer.style.width = this._dimensions.scaledWidth + "px";
        this._viewContainer.style.height = this._dimensions.scaledHeight + "px";
        if (this._viewCanvas) {
            this._viewCanvas.style.width = this._dimensions.scaledWidth + "px";
            this._viewCanvas.style.height = this._dimensions.scaledHeight + "px";
        }
        this._scaleIsValid = false;
    }
    get viewValid() {
        return this._scaleIsValid && this._viewRendered;
    }
    destroy() {
        this._previewContainer.remove();
        this._viewContainer.remove();
        this._pageProxy.cleanup();
    }
    renderPreviewAsync(force = false) {
        return __awaiter$1(this, void 0, void 0, function* () {
            if (this._renderPromise) {
                if (force) {
                    this.cancelRenderTask();
                }
                yield this._renderPromise;
            }
            if (!force && this._previewRendered) {
                return;
            }
            this._renderPromise = this.runPreviewRenderAsync();
            return this._renderPromise;
        });
    }
    renderViewAsync(force = false) {
        return __awaiter$1(this, void 0, void 0, function* () {
            if (this._renderPromise) {
                if (force) {
                    this.cancelRenderTask();
                }
                yield this._renderPromise;
            }
            if (!force && this.viewValid) {
                return;
            }
            this._renderPromise = this.runViewRenderAsync();
            return this._renderPromise;
        });
    }
    clearPreview() {
        this._previewContainer.innerHTML = "";
    }
    clearView() {
        var _a, _b;
        (_a = this._text) === null || _a === void 0 ? void 0 : _a.destroy();
        (_b = this._viewCanvas) === null || _b === void 0 ? void 0 : _b.remove();
        this._viewRendered = false;
    }
    cancelRenderTask() {
        if (this._renderTask) {
            this._renderTask.cancel();
            this._renderTask = null;
        }
    }
    runRenderTaskAsync(renderParams) {
        return __awaiter$1(this, void 0, void 0, function* () {
            this.cancelRenderTask();
            this._renderTask = this._pageProxy.render(renderParams);
            try {
                yield this._renderTask.promise;
            }
            catch (error) {
                if (error instanceof RenderingCancelledException) {
                    return false;
                }
                else {
                    throw error;
                }
            }
            finally {
                this._renderTask = null;
            }
            return true;
        });
    }
    createPreviewCanvas() {
        const canvas = document.createElement("canvas");
        canvas.classList.add("page-canvas");
        const dpr = window.devicePixelRatio;
        const { previewWidth: width, previewHeight: height } = this._dimensions;
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        return canvas;
    }
    createViewCanvas() {
        const canvas = document.createElement("canvas");
        canvas.classList.add("page-canvas");
        canvas.style.width = this._dimensions.scaledWidth + "px";
        canvas.style.height = this._dimensions.scaledHeight + "px";
        canvas.width = this._dimensions.scaledDprWidth;
        canvas.height = this._dimensions.scaledDprHeight;
        return canvas;
    }
    scaleCanvasImage(sourceCanvas, targetCanvas) {
        let ratio = this._scale / this._maxScale;
        let tempSource = sourceCanvas;
        let tempTarget;
        while (ratio < 0.5) {
            tempTarget = document.createElement("canvas");
            tempTarget.width = tempSource.width * 0.5;
            tempTarget.height = tempSource.height * 0.5;
            tempTarget.getContext("2d").drawImage(tempSource, 0, 0, tempTarget.width, tempTarget.height);
            tempSource = tempTarget;
            ratio *= 2;
        }
        targetCanvas.getContext("2d").drawImage(tempSource, 0, 0, targetCanvas.width, targetCanvas.height);
    }
    runPreviewRenderAsync() {
        return __awaiter$1(this, void 0, void 0, function* () {
            const canvas = this.createPreviewCanvas();
            const params = {
                canvasContext: canvas.getContext("2d"),
                viewport: this._viewport.clone({ scale: canvas.width / this._dimensions.width }),
            };
            const result = yield this.runRenderTaskAsync(params);
            if (!result) {
                this._previewRendered = false;
                return;
            }
            this._previewContainer.innerHTML = "";
            this._previewContainer.append(canvas);
            this._previewRendered = true;
        });
    }
    runViewRenderAsync() {
        var _a, _b;
        return __awaiter$1(this, void 0, void 0, function* () {
            const scale = this._scale;
            (_a = this._text) === null || _a === void 0 ? void 0 : _a.destroy();
            const canvas = this.createViewCanvas();
            const params = {
                canvasContext: canvas.getContext("2d"),
                viewport: this._viewport.clone({ scale: scale * window.devicePixelRatio }),
                enableWebGL: true,
            };
            const result = yield this.runRenderTaskAsync(params);
            if (!result || scale !== this._scale) {
                return;
            }
            (_b = this._viewCanvas) === null || _b === void 0 ? void 0 : _b.remove();
            this._viewContainer.append(canvas);
            this._viewCanvas = canvas;
            this._viewRendered = true;
            this._text = yield ViewPageText.appendPageTextAsync(this._pageProxy, this._viewContainer, scale);
            if (scale === this._scale) {
                this._scaleIsValid = true;
            }
        });
    }
}

const codes = {
    NULL: 0,
    BACKSPACE: 8,
    HORIZONTAL_TAB: 9,
    LINE_FEED: 10,
    VERTICAL_TAB: 11,
    FORM_FEED: 12,
    CARRIAGE_RETURN: 13,
    WHITESPACE: 32,
    EXCLAMATION_MARK: 33,
    DOUBLE_QUOTE: 34,
    HASH: 35,
    DOLLAR: 36,
    PERCENT: 37,
    AMPERSAND: 38,
    QUOTE: 39,
    L_PARENTHESE: 40,
    R_PARENTHESE: 41,
    ASTERISK: 42,
    PLUS: 43,
    COMMA: 44,
    MINUS: 45,
    DOT: 46,
    SLASH: 47,
    D_0: 48,
    D_1: 49,
    D_2: 50,
    D_3: 51,
    D_4: 52,
    D_5: 53,
    D_6: 54,
    D_7: 55,
    D_8: 56,
    D_9: 57,
    COLON: 58,
    SEMICOLON: 59,
    LESS: 60,
    EQUAL: 61,
    GREATER: 62,
    QUESTION_MARK: 63,
    AT: 64,
    A: 65,
    B: 66,
    C: 67,
    D: 68,
    E: 69,
    F: 70,
    G: 71,
    H: 72,
    I: 73,
    J: 74,
    K: 75,
    L: 76,
    M: 77,
    N: 78,
    O: 79,
    P: 80,
    Q: 81,
    R: 82,
    S: 83,
    T: 84,
    U: 85,
    V: 86,
    W: 87,
    X: 88,
    Y: 89,
    Z: 90,
    L_BRACKET: 91,
    BACKSLASH: 92,
    R_BRACKET: 93,
    CARET: 94,
    UNDERSCORE: 95,
    BACKTICK: 96,
    a: 97,
    b: 98,
    c: 99,
    d: 100,
    e: 101,
    f: 102,
    g: 103,
    h: 104,
    i: 105,
    j: 106,
    k: 107,
    l: 108,
    m: 109,
    n: 110,
    o: 111,
    p: 112,
    q: 113,
    r: 114,
    s: 115,
    t: 116,
    u: 117,
    v: 118,
    w: 119,
    x: 120,
    y: 121,
    z: 122,
    L_BRACE: 123,
    VERTICAL_LINE: 124,
    R_BRACE: 125,
    TILDE: 126,
};
const keywordCodes = {
    NULL: [codes.n, codes.u, codes.l, codes.l],
    OBJ: [codes.o, codes.b, codes.j],
    OBJ_END: [codes.e, codes.n, codes.d, codes.o, codes.b, codes.j],
    STREAM_START: [codes.s, codes.t, codes.r, codes.e, codes.a, codes.m],
    STREAM_END: [codes.e, codes.n, codes.d,
        codes.s, codes.t, codes.r, codes.e, codes.a, codes.m],
    DICT_START: [codes.LESS, codes.LESS],
    DICT_END: [codes.GREATER, codes.GREATER],
    ARRAY_START: [codes.L_BRACKET],
    ARRAY_END: [codes.R_BRACKET],
    STR_LITERAL_START: [codes.L_PARENTHESE],
    STR_LITERAL_END: [codes.R_PARENTHESE],
    STR_HEX_START: [codes.LESS],
    STR_HEX_END: [codes.GREATER],
    VERSION: [codes.PERCENT, codes.P, codes.D, codes.F, codes.MINUS],
    XREF_TABLE: [codes.x, codes.r, codes.e, codes.f],
    XREF_STREAM: [codes.SLASH, codes.X, codes.R, codes.e, codes.f],
    XREF_HYBRID: [codes.X, codes.R, codes.e, codes.f, codes.S, codes.t, codes.m],
    XREF_START: [codes.s, codes.t, codes.a, codes.r, codes.t,
        codes.x, codes.r, codes.e, codes.f],
    TRAILER: [codes.t, codes.r, codes.a, codes.i, codes.l, codes.e, codes.r],
    END_OF_FILE: [codes.PERCENT, codes.PERCENT, codes.e, codes.o, codes.f],
    END_OF_LINE: [codes.CARRIAGE_RETURN, codes.LINE_FEED],
};
const DELIMITER_CHARS = new Set([
    codes.PERCENT,
    codes.L_PARENTHESE,
    codes.R_PARENTHESE,
    codes.SLASH,
    codes.LESS,
    codes.GREATER,
    codes.L_BRACKET,
    codes.R_BRACKET,
    codes.L_BRACE,
    codes.R_BRACE,
]);
const SPACE_CHARS = new Set([
    codes.NULL,
    codes.HORIZONTAL_TAB,
    codes.LINE_FEED,
    codes.FORM_FEED,
    codes.CARRIAGE_RETURN,
    codes.WHITESPACE,
]);
const DIGIT_CHARS = new Set([
    codes.D_0,
    codes.D_1,
    codes.D_2,
    codes.D_3,
    codes.D_4,
    codes.D_5,
    codes.D_6,
    codes.D_7,
    codes.D_8,
    codes.D_9,
]);
function isRegularChar(code) {
    return !DELIMITER_CHARS.has(code) && !SPACE_CHARS.has(code);
}

const xRefTypes = {
    TABLE: 0,
    STREAM: 1,
    HYBRID: 2,
};
const streamFilters = {
    ASCII85: "/ASCII85Decode",
    ASCIIHEX: "/ASCIIHexDecode",
    CCF: "/CCITTFaxDecode",
    CRYPT: "/Crypt",
    DCT: "/DCTDecode",
    FLATE: "/FlateDecode",
    JBIG2: "/JBIG2Decode",
    JPX: "/JPXDecode",
    LZW: "/LZWDecode",
    RLX: "/RunLengthDecode",
};
const flatePredictors = {
    NONE: 1,
    TIFF: 2,
    PNG_NONE: 10,
    PNG_SUB: 11,
    PNG_UP: 12,
    PNG_AVERAGE: 13,
    PNG_PAETH: 14,
    PNG_OPTIMUM: 15,
};
const streamTypes = {
    FORM_XOBJECT: "/XObject",
    XREF: "/XRef",
    OBJECT_STREAM: "/ObjStm",
    METADATA_STREAM: "/Metadata",
};
const dictTypes = {
    XREF: "/XRef",
    XOBJECT: "/XObject",
    CATALOG: "/Catalog",
    PAGE_TREE: "/Pages",
    PAGE: "/Page",
    ANNOTATION: "/Annot",
    BORDER_STYLE: "/Border",
    OPTIONAL_CONTENT_GROUP: "/OCG",
    OPTIONAL_CONTENT_MD: "/OCMD",
    EXTERNAL_DATA: "/ExDATA",
    ACTION: "/Action",
    MEASURE: "/Measure",
    DEV_EXTENSIONS: "/DeveloperExtensions",
    EMPTY: "",
};
const valueTypes = {
    UNKNOWN: 0,
    NULL: 1,
    BOOLEAN: 2,
    NUMBER: 3,
    STRING_LITERAL: 4,
    STRING_HEX: 5,
    NAME: 6,
    ARRAY: 7,
    DICTIONARY: 8,
    STREAM: 9,
    REF: 10,
    COMMENT: 11,
};
const supportedFilters = new Set([
    streamFilters.FLATE,
]);

class HexString {
    constructor(literal, hex, bytes) {
        this.literal = literal;
        this.hex = hex;
        this.bytes = bytes;
    }
    static fromBytes(bytes) {
        const literal = new TextDecoder().decode(bytes);
        const hex = Array.from(bytes, (byte, i) => ("0" + literal.charCodeAt(i).toString(16)).slice(-2)).join("");
        return new HexString(literal, hex, bytes);
    }
    static fromHexString(hex) {
        const bytes = new TextEncoder().encode(hex);
        const literal = new TextDecoder().decode(bytes);
        return new HexString(literal, hex, bytes);
    }
    static fromLiteralString(literal) {
        const hex = Array.from(literal, (char, i) => ("000" + literal.charCodeAt(i).toString(16)).slice(-4)).join("");
        const bytes = new TextEncoder().encode(hex);
        return new HexString(literal, hex, bytes);
    }
    ;
    toArray(bracketed = false) {
        return bracketed
            ? new Uint8Array([...keywordCodes.STR_HEX_START,
                ...this.bytes, ...keywordCodes.STR_HEX_END])
            : new Uint8Array(this.bytes);
    }
}

class LiteralString {
    constructor(literal, bytes) {
        this.literal = literal;
        this.bytes = bytes;
    }
    static fromBytes(bytes) {
        const literal = new TextDecoder().decode(LiteralString.unescape(bytes));
        return new LiteralString(literal, bytes);
    }
    static fromString(source) {
        const bytes = LiteralString.escape(new TextEncoder().encode(source));
        return new LiteralString(source, bytes);
    }
    static escape(bytes) {
        const result = [];
        for (let i = 0; i < bytes.length; i++) {
            switch (bytes[i]) {
                case codes.LINE_FEED:
                    result.push(codes.BACKSLASH);
                    result.push(codes.n);
                    break;
                case codes.CARRIAGE_RETURN:
                    result.push(codes.BACKSLASH);
                    result.push(codes.r);
                    break;
                case codes.HORIZONTAL_TAB:
                    result.push(codes.BACKSLASH);
                    result.push(codes.t);
                    break;
                case codes.BACKSPACE:
                    result.push(codes.BACKSLASH);
                    result.push(codes.b);
                    break;
                case codes.FORM_FEED:
                    result.push(codes.BACKSLASH);
                    result.push(codes.f);
                    break;
                case codes.L_PARENTHESE:
                    result.push(codes.BACKSLASH);
                    result.push(codes.L_PARENTHESE);
                    break;
                case codes.R_PARENTHESE:
                    result.push(codes.BACKSLASH);
                    result.push(codes.R_PARENTHESE);
                    break;
                case codes.BACKSLASH:
                    result.push(codes.BACKSLASH);
                    result.push(codes.BACKSLASH);
                    break;
                default:
                    result.push(bytes[i]);
                    break;
            }
        }
        return new Uint8Array(result);
    }
    static unescape(bytes) {
        const result = [];
        let escaped = false;
        for (let i = 0; i < bytes.length; i++) {
            if (escaped) {
                switch (bytes[i]) {
                    case codes.n:
                        result.push(codes.LINE_FEED);
                        break;
                    case codes.r:
                        result.push(codes.CARRIAGE_RETURN);
                        break;
                    case codes.t:
                        result.push(codes.HORIZONTAL_TAB);
                        break;
                    case codes.b:
                        result.push(codes.BACKSPACE);
                        break;
                    case codes.f:
                        result.push(codes.FORM_FEED);
                        break;
                    case codes.L_PARENTHESE:
                        result.push(codes.L_PARENTHESE);
                        break;
                    case codes.R_PARENTHESE:
                        result.push(codes.R_PARENTHESE);
                        break;
                    case codes.BACKSLASH:
                        result.push(codes.BACKSLASH);
                        break;
                    default:
                        result.push(bytes[i]);
                        break;
                }
                escaped = false;
                continue;
            }
            if (bytes[i] === codes.BACKSLASH) {
                escaped = true;
                continue;
            }
            result.push(bytes[i]);
        }
        return new Uint8Array(result);
    }
    toArray(bracketed = false) {
        return bracketed
            ? new Uint8Array([...keywordCodes.STR_LITERAL_START,
                ...this.bytes, ...keywordCodes.STR_LITERAL_END])
            : new Uint8Array(this.bytes);
    }
}

class Parser {
    constructor(data) {
        if (!(data === null || data === void 0 ? void 0 : data.length)) {
            throw new Error("Data is empty");
        }
        this._data = data;
        this._maxIndex = data.length - 1;
    }
    get maxIndex() {
        return this._maxIndex;
    }
    getPdfVersion() {
        var _a;
        const i = this.findSubarrayIndex(keywordCodes.VERSION);
        if (!i) {
            throw new Error("PDF not valid. Version not found");
        }
        const version = (_a = this.parseNumberAt(i.end + 1, true)) === null || _a === void 0 ? void 0 : _a.value;
        if (!version) {
            throw new Error("Error parsing version number");
        }
        return version.toFixed(1);
    }
    findSubarrayIndex(sub, options) {
        var _a, _b;
        const arr = this._data;
        if (!(sub === null || sub === void 0 ? void 0 : sub.length)) {
            return null;
        }
        const direction = (options === null || options === void 0 ? void 0 : options.direction) || "straight";
        const minIndex = Math.max(Math.min((_a = options === null || options === void 0 ? void 0 : options.minIndex) !== null && _a !== void 0 ? _a : 0, this._maxIndex), 0);
        const maxIndex = Math.max(Math.min((_b = options === null || options === void 0 ? void 0 : options.maxIndex) !== null && _b !== void 0 ? _b : this._maxIndex, this._maxIndex), 0);
        const allowOpened = !(options === null || options === void 0 ? void 0 : options.closedOnly);
        let i = direction === "straight"
            ? minIndex
            : maxIndex;
        let j;
        if (direction === "straight") {
            outer_loop: for (i; i <= maxIndex; i++) {
                for (j = 0; j < sub.length; j++) {
                    if (arr[i + j] !== sub[j]) {
                        continue outer_loop;
                    }
                }
                if (allowOpened || !isRegularChar(arr[i + j])) {
                    return { start: i, end: i + j - 1 };
                }
            }
        }
        else {
            const subMaxIndex = sub.length - 1;
            outer_loop: for (i; i >= minIndex; i--) {
                for (j = 0; j < sub.length; j++) {
                    if (arr[i - j] !== sub[subMaxIndex - j]) {
                        continue outer_loop;
                    }
                }
                if (allowOpened || !isRegularChar(arr[i - j])) {
                    return { start: i - j + 1, end: i };
                }
            }
        }
        return null;
    }
    findCharIndex(charCode, direction = "straight", start) {
        return this.findSingleCharIndex((value) => charCode === value, direction, start);
    }
    findNewLineIndex(direction = "straight", start) {
        let lineBreakIndex = this.findSingleCharIndex((value) => value === codes.CARRIAGE_RETURN || value === codes.LINE_FEED, direction, start);
        if (lineBreakIndex === -1) {
            return -1;
        }
        if (direction === "straight") {
            if (this._data[lineBreakIndex] === codes.CARRIAGE_RETURN
                && this._data[lineBreakIndex + 1] === codes.LINE_FEED) {
                lineBreakIndex++;
            }
            return Math.min(lineBreakIndex + 1, this._maxIndex);
        }
        else {
            if (this._data[lineBreakIndex] === codes.LINE_FEED
                && this._data[lineBreakIndex - 1] === codes.CARRIAGE_RETURN) {
                lineBreakIndex--;
            }
            return Math.max(lineBreakIndex - 1, 0);
        }
    }
    findSpaceIndex(direction = "straight", start) {
        return this.findSingleCharIndex((value) => SPACE_CHARS.has(value), direction, start);
    }
    findNonSpaceIndex(direction = "straight", start) {
        return this.findSingleCharIndex((value) => !SPACE_CHARS.has(value), direction, start);
    }
    findDelimiterIndex(direction = "straight", start) {
        return this.findSingleCharIndex((value) => DELIMITER_CHARS.has(value), direction, start);
    }
    findNonDelimiterIndex(direction = "straight", start) {
        return this.findSingleCharIndex((value) => !DELIMITER_CHARS.has(value), direction, start);
    }
    findIrregularIndex(direction = "straight", start) {
        return this.findSingleCharIndex((value) => !isRegularChar(value), direction, start);
    }
    findRegularIndex(direction = "straight", start) {
        return this.findSingleCharIndex((value) => isRegularChar(value), direction, start);
    }
    getValueTypeAt(start, skipEmpty = true) {
        if (skipEmpty) {
            start = this.skipEmpty(start);
        }
        if (this.isOutside(start)) {
            return null;
        }
        const arr = this._data;
        const i = start;
        const charCode = arr[i];
        switch (charCode) {
            case codes.SLASH:
                if (isRegularChar(arr[i + 1])) {
                    return valueTypes.NAME;
                }
                return valueTypes.UNKNOWN;
            case codes.L_BRACKET:
                return valueTypes.ARRAY;
            case codes.L_PARENTHESE:
                return valueTypes.STRING_LITERAL;
            case codes.LESS:
                if (codes.LESS === arr[i + 1]) {
                    return valueTypes.DICTIONARY;
                }
                return valueTypes.STRING_HEX;
            case codes.PERCENT:
                return valueTypes.COMMENT;
            case codes.D_0:
            case codes.D_1:
            case codes.D_2:
            case codes.D_3:
            case codes.D_4:
            case codes.D_5:
            case codes.D_6:
            case codes.D_7:
            case codes.D_8:
            case codes.D_9:
                const nextDelimIndex = this.findDelimiterIndex("straight", i + 1);
                if (nextDelimIndex !== -1) {
                    const refEndIndex = this.findCharIndex(codes.R, "reverse", nextDelimIndex - 1);
                    if (refEndIndex !== -1 && refEndIndex > i) {
                        return valueTypes.REF;
                    }
                }
                return valueTypes.NUMBER;
            case codes.s:
                if (arr[i + 1] === codes.t
                    && arr[i + 2] === codes.r
                    && arr[i + 3] === codes.e
                    && arr[i + 4] === codes.a
                    && arr[i + 5] === codes.m) {
                    return valueTypes.STREAM;
                }
                return valueTypes.UNKNOWN;
            case codes.t:
                if (arr[i + 1] === codes.r
                    && arr[i + 2] === codes.u
                    && arr[i + 3] === codes.e) {
                    return valueTypes.BOOLEAN;
                }
                return valueTypes.UNKNOWN;
            case codes.f:
                if (arr[i + 1] === codes.a
                    && arr[i + 2] === codes.l
                    && arr[i + 3] === codes.s
                    && arr[i + 4] === codes.e) {
                    return valueTypes.BOOLEAN;
                }
                return valueTypes.UNKNOWN;
            default:
                return valueTypes.UNKNOWN;
        }
    }
    getIndirectObjectBoundsAt(start, skipEmpty = true) {
        if (skipEmpty) {
            start = this.skipEmpty(start);
        }
        if (this.isOutside(start)) {
            return null;
        }
        const objStartIndex = this.findSubarrayIndex(keywordCodes.OBJ, { minIndex: start, closedOnly: true });
        if (!objStartIndex || objStartIndex.start !== start) {
            return null;
        }
        const contentStart = this.findNonSpaceIndex("straight", objStartIndex.end + 1);
        if (contentStart === -1) {
            return null;
        }
        const objEndIndex = this.findSubarrayIndex(keywordCodes.OBJ_END, { minIndex: contentStart, closedOnly: true });
        if (!objEndIndex) {
            return null;
        }
        const contentEnd = this.findNonSpaceIndex("reverse", objEndIndex.start - 1);
        return {
            start: objStartIndex.start,
            end: objStartIndex.end,
            contentStart,
            contentEnd,
        };
    }
    getDictBoundsAt(start, skipEmpty = true) {
        if (skipEmpty) {
            start = this.skipEmpty(start);
        }
        if (this.isOutside(start) || this._data[start] !== codes.LESS) {
            return null;
        }
        const dictStart = this.findSubarrayIndex(keywordCodes.DICT_START, { minIndex: start });
        if (!dictStart) {
            return null;
        }
        const contentStart = this.findNonSpaceIndex("straight", dictStart.end + 1);
        if (contentStart === -1) {
            return null;
        }
        const dictEnd = this.findSubarrayIndex(keywordCodes.DICT_END, { minIndex: dictStart.end + 1 });
        if (!dictEnd) {
            return null;
        }
        const contentEnd = this.findNonSpaceIndex("reverse", dictEnd.start - 1);
        if (contentEnd < contentStart) {
            return null;
        }
        return {
            start: dictStart.start,
            end: dictEnd.end,
            contentStart,
            contentEnd,
        };
    }
    getArrayBoundsAt(start, skipEmpty = true) {
        if (skipEmpty) {
            start = this.skipEmpty(start);
        }
        if (this.isOutside(start) || this._data[start] !== codes.L_BRACKET) {
            return null;
        }
        let subArrayOpened = 0;
        let i = start + 1;
        let code;
        while (subArrayOpened || code !== codes.R_BRACKET) {
            code = this._data[i++];
            if (code === codes.L_BRACKET) {
                subArrayOpened++;
            }
            else if (subArrayOpened && code === codes.R_BRACKET) {
                subArrayOpened--;
            }
        }
        const arrayEnd = i - 1;
        if (arrayEnd - start < 2) {
            return null;
        }
        return { start, end: arrayEnd };
    }
    parseNumberAt(start, float = false, skipEmpty = true) {
        if (skipEmpty) {
            start = this.skipEmpty(start);
        }
        if (this.isOutside(start) || !isRegularChar(this._data[start])) {
            return null;
        }
        let i = start;
        let numberStr = "";
        let value = this._data[i];
        if (value === codes.MINUS) {
            numberStr += value;
            value = this._data[++i];
        }
        while (DIGIT_CHARS.has(value)
            || (float && value === codes.DOT)) {
            numberStr += String.fromCharCode(value);
            value = this._data[++i];
        }
        return numberStr
            ? { value: +numberStr, start, end: i - 1 }
            : null;
    }
    parseNameAt(start, includeSlash = true, skipEmpty = true) {
        if (skipEmpty) {
            start = this.skipEmpty(start);
        }
        if (this.isOutside(start) || this._data[start] !== codes.SLASH) {
            return null;
        }
        let i = start + 1;
        let result = includeSlash
            ? "/"
            : "";
        let value = this._data[i];
        while (isRegularChar(value)) {
            result += String.fromCharCode(value);
            value = this._data[++i];
        }
        return result.length > 1
            ? { value: result, start, end: i - 1 }
            : null;
    }
    parseHexAt(start, skipEmpty = true) {
        if (skipEmpty) {
            start = this.skipEmpty(start);
        }
        if (this.isOutside(start) || this._data[start] !== codes.LESS) {
            return null;
        }
        const end = this.findCharIndex(codes.GREATER, "straight", start + 1);
        if (end === -1) {
            return;
        }
        const hex = HexString.fromBytes(this._data.slice(start, end + 1));
        return { value: hex, start, end };
    }
    parseLiteralAt(start, skipEmpty = true) {
        if (skipEmpty) {
            start = this.skipEmpty(start);
        }
        if (this.isOutside(start) || this._data[start] !== codes.L_PARENTHESE) {
            return null;
        }
        const arr = this._data;
        const bytes = [];
        let i = start + 1;
        let prevCode;
        let code;
        let opened = 0;
        while (opened || code !== codes.R_PARENTHESE || prevCode === codes.BACKSLASH) {
            if (code) {
                prevCode = code;
            }
            code = arr[i++];
            bytes.push(code);
            if (prevCode !== codes.BACKSLASH) {
                if (code === codes.L_PARENTHESE) {
                    opened += 1;
                }
                else if (code === codes.R_PARENTHESE) {
                    opened -= 1;
                }
            }
        }
        if (!bytes.length) {
            return null;
        }
        const literal = LiteralString.fromBytes(new Uint8Array(bytes));
        return { value: literal, start, end: i - 1 };
    }
    parseNumberArrayAt(start, float = true, skipEmpty = true) {
        const arrayBounds = this.getArrayBoundsAt(start, skipEmpty);
        if (!arrayBounds) {
            return null;
        }
        const numbers = [];
        let current;
        let i = arrayBounds.start + 1;
        while (i < arrayBounds.end) {
            current = this.parseNumberAt(i, float, true);
            if (!current) {
                break;
            }
            numbers.push(current.value);
            i = current.end + 1;
        }
        return { value: numbers, start: arrayBounds.start, end: arrayBounds.end };
    }
    parseHexArrayAt(start, skipEmpty = true) {
        const arrayBounds = this.getArrayBoundsAt(start, skipEmpty);
        if (!arrayBounds) {
            return null;
        }
        const hexes = [];
        let current;
        let i = arrayBounds.start + 1;
        while (i < arrayBounds.end) {
            current = this.parseHexAt(i, true);
            if (!current) {
                break;
            }
            hexes.push(current.value);
            i = current.end + 1;
        }
        return { value: hexes, start: arrayBounds.start, end: arrayBounds.end };
    }
    skipEmpty(start) {
        let index = this.findNonSpaceIndex("straight", start);
        if (index === -1) {
            return -1;
        }
        if (this._data[index] === codes.PERCENT) {
            const afterComment = this.findNewLineIndex("straight", index + 1);
            if (afterComment === -1) {
                return -1;
            }
            index = this.findNonSpaceIndex("straight", afterComment);
        }
        return index;
    }
    skipToNextName(start, max) {
        start || (start = 0);
        max = max
            ? Math.max(max, this._maxIndex)
            : 0;
        if (max < start) {
            return -1;
        }
        for (let i = start; i <= max; i++) {
            if (this._data[i] === codes.SLASH) {
                return i;
            }
        }
        return -1;
    }
    getCharCode(index) {
        return this._data[index];
    }
    getChar(index) {
        const code = this._data[index];
        if (!isNaN(code)) {
            return String.fromCharCode(code);
        }
        return null;
    }
    sliceCharCodes(start, end) {
        return this._data.slice(start, (end || start) + 1);
    }
    sliceChars(start, end) {
        return String.fromCharCode(...this._data.slice(start, (end || start) + 1));
    }
    isOutside(index) {
        return (index < 0 || index > this._maxIndex);
    }
    getValidStartIndex(direction, start) {
        return !isNaN(start)
            ? Math.max(Math.min(start, this._maxIndex), 0)
            : direction === "straight"
                ? 0
                : this._maxIndex;
    }
    findSingleCharIndex(filter, direction = "straight", start) {
        const arr = this._data;
        let i = this.getValidStartIndex(direction, start);
        if (direction === "straight") {
            for (i; i <= this._maxIndex; i++) {
                if (filter(arr[i])) {
                    return i;
                }
            }
        }
        else {
            for (i; i >= 0; i--) {
                if (filter(arr[i])) {
                    return i;
                }
            }
        }
        return -1;
    }
}

class ObjectId {
    constructor(id, generation) {
        this.id = id !== null && id !== void 0 ? id : 0;
        this.generation = generation !== null && generation !== void 0 ? generation : 0;
        this.reused = this.generation > 0;
    }
    static parse(parser, index, skipEmpty = true) {
        const start = skipEmpty
            ? parser.findRegularIndex("straight", index)
            : index;
        if (start < 0 || start > parser.maxIndex) {
            return null;
        }
        const id = parser.parseNumberAt(start, false, false);
        if (!id || isNaN(id.value)) {
            return null;
        }
        const generation = parser.parseNumberAt(id.end + 2, false, false);
        if (!generation || isNaN(generation.value)) {
            return null;
        }
        return {
            value: new ObjectId(id.value, generation.value),
            start,
            end: generation.end,
        };
    }
    static parseRef(parser, index, skipEmpty = true) {
        const id = ObjectId.parse(parser, index, skipEmpty);
        if (!id) {
            return null;
        }
        const rIndexSupposed = id.end + 2;
        const rIndex = parser.findSubarrayIndex([codes.R], { minIndex: rIndexSupposed, closedOnly: true });
        if (!rIndex || rIndex.start !== rIndexSupposed) {
            return null;
        }
        return {
            value: id.value,
            start: id.start,
            end: rIndex.end,
        };
    }
    equals(other) {
        return this.id === other.id
            && this.generation === other.generation;
    }
    toArray() {
        return new TextEncoder().encode(`${this.id} ${this.generation} R`);
    }
    toString() {
        return this.id + "|" + this.generation;
    }
}

class XRef {
    constructor(type) {
        this._type = type;
    }
    get type() {
        return this._type;
    }
}

class XRefHybrid extends XRef {
    constructor(trailerDict, trailerStream) {
        super(xRefTypes.HYBRID);
        this._trailerDict = trailerDict;
        this._trailerStream = trailerStream;
    }
    static parse(parser, index, skipEmpty = true) {
        return {
            value: new XRefHybrid(null, null),
            start: null,
            end: null,
        };
    }
}

class Dict {
    constructor(type) {
        this._customProps = new Map();
        this.Type = type;
    }
    get customProps() {
        return new Map(this._customProps);
    }
}

class FlateParamsDict extends Dict {
    constructor() {
        super(dictTypes.EMPTY);
        this.Predictor = flatePredictors.NONE;
        this.Colors = 1;
        this.BitsPerComponent = 8;
        this.Columns = 1;
    }
    static parse(parser, start, end) {
        const dict = new FlateParamsDict();
        let i = start + 2;
        let name;
        let parseResult;
        while (true) {
            parseResult = parser.parseNameAt(i);
            if (parseResult) {
                i = parseResult.end + 1;
                name = parseResult.value;
                switch (name) {
                    case "/Predictor":
                        const predictor = parser.parseNumberAt(i, false);
                        if (predictor) {
                            dict.Predictor = predictor.value;
                            i = predictor.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Colors property value");
                        }
                        break;
                    case "/Colors":
                        const colors = parser.parseNumberAt(i, false);
                        if (colors) {
                            dict.Colors = colors.value;
                            i = colors.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Colors property value");
                        }
                        break;
                    case "/BitsPerComponent":
                        const bits = parser.parseNumberAt(i, false);
                        if (bits) {
                            dict.BitsPerComponent = bits.value;
                            i = bits.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /BitsPerComponent property value");
                        }
                        break;
                    case "/Columns":
                        const columns = parser.parseNumberAt(i, false);
                        if (columns) {
                            dict.Columns = columns.value;
                            i = columns.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Columns property value");
                        }
                        break;
                    default:
                        i = parser.skipToNextName(i, end);
                        break;
                }
            }
            else {
                break;
            }
        }
        return { value: dict, start, end };
    }
}

class PdfObject {
    constructor() {
    }
}

class FlateDecoder {
    static Decode(input, predictor = flatePredictors.NONE, columns = 1, components = 1, bpc = 8) {
        console.log(input);
        const inflated = inflate(input);
        console.log(inflated);
        switch (predictor) {
            case (flatePredictors.NONE):
                return inflated;
            case (flatePredictors.PNG_NONE):
            case (flatePredictors.PNG_SUB):
            case (flatePredictors.PNG_UP):
            case (flatePredictors.PNG_AVERAGE):
            case (flatePredictors.PNG_PAETH):
            case (flatePredictors.PNG_OPTIMUM):
                return FlateDecoder.removePngFilter(inflated, columns, components, bpc);
            case (flatePredictors.TIFF):
                throw new Error("Unsupported filter predictor");
        }
    }
    static Encode(input) {
        return null;
    }
    static removePngFilter(input, columns, components, bpc) {
        const interval = Math.ceil(components * bpc / 8);
        const lineLen = columns * interval;
        const lineLen_filtered = lineLen + 1;
        if (!!(input.length % lineLen_filtered)) {
            throw new Error("Data length doesn't match filter columns");
        }
        const output = new Uint8Array(input.length / lineLen_filtered * lineLen);
        const previous = new Array(lineLen).fill(0);
        const current = new Array(lineLen).fill(0);
        const getLeft = (j) => j - interval < 0
            ? 0
            : current[j - interval];
        const getAbove = (j) => previous[j];
        const getUpperLeft = (j) => j - interval < 0
            ? 0
            : previous[j - interval];
        let x = 0;
        let y = 0;
        let k = 0;
        let rowStart = 0;
        let filterType = 0;
        let result = 0;
        for (let i = 0; i < input.length; i++) {
            if (i % lineLen_filtered === 0) {
                filterType = input[i];
                x = 0;
                if (i) {
                    for (k = 0; k < lineLen; k++) {
                        previous[k] = output[rowStart + k];
                    }
                }
                rowStart = y;
            }
            else {
                current[x] = input[i];
                switch (filterType) {
                    case 0:
                        result = current[x];
                        break;
                    case 1:
                        result = (current[x] + getLeft(x)) % 256;
                        break;
                    case 2:
                        result = (current[x] + getAbove(x)) % 256;
                        break;
                    case 3:
                        result = (current[x] + Math.floor((getAbove(x) + getLeft(x)) / 2)) % 256;
                        break;
                    case 4:
                        result = (current[x] + this.paethPredictor(getLeft(x), getAbove(x), getUpperLeft(x))) % 256;
                        break;
                }
                output[y++] = result;
                x++;
            }
        }
        return output;
    }
    static applyPngFilter(input, predictor, columns) {
        return null;
    }
    static paethPredictor(a, b, c) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        if (pa <= pb && pa <= pc) {
            return a;
        }
        else if (pb <= pc) {
            return b;
        }
        else {
            return c;
        }
    }
}

class Stream extends PdfObject {
    constructor(type = null) {
        super();
        this.Type = type;
    }
    tryParseProps(parser, bounds) {
        var _a, _b, _c, _d;
        if (!parser || !bounds) {
            return false;
        }
        const start = bounds.contentStart || bounds.start;
        const end = bounds.contentEnd || bounds.end;
        const streamEndIndex = parser.findSubarrayIndex(keywordCodes.STREAM_END, {
            direction: "reverse",
            minIndex: start,
            maxIndex: end,
            closedOnly: true
        });
        if (!streamEndIndex) {
            return false;
        }
        const streamStartIndex = parser.findSubarrayIndex(keywordCodes.STREAM_START, {
            direction: "reverse",
            minIndex: start,
            maxIndex: streamEndIndex.start - 1,
            closedOnly: true
        });
        if (!streamEndIndex) {
            return false;
        }
        const lastBeforeStream = streamStartIndex.start - 1;
        let i = parser.skipToNextName(start, lastBeforeStream);
        if (i === -1) {
            return false;
        }
        let name;
        let parseResult;
        while (true) {
            parseResult = parser.parseNameAt(i);
            if (parseResult) {
                i = parseResult.end + 1;
                name = parseResult.value;
                switch (name) {
                    case "/Type":
                        const type = parser.parseNameAt(i);
                        if (type) {
                            if (this.Type && this.Type !== type.value) {
                                return false;
                            }
                            i = type.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Type property value");
                        }
                        break;
                    case "/Length":
                        const length = parser.parseNumberAt(i, false);
                        if (length) {
                            this.Length = length.value;
                            i = length.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Length property value");
                        }
                        break;
                    case "/Filter":
                        const filter = parser.parseNameAt(i);
                        if (filter && supportedFilters.has(filter.value)) {
                            this.Filter = filter.value;
                            i = filter.end + 1;
                        }
                        else {
                            throw new Error("Unsupported /Filter property value");
                        }
                        break;
                    case "/DecodeParms":
                        const decodeParamsBounds = parser.getDictBoundsAt(i);
                        if (decodeParamsBounds) {
                            const params = FlateParamsDict.parse(parser, decodeParamsBounds.start, decodeParamsBounds.end);
                            if (params) {
                                this.DecodeParms = params.value;
                            }
                            i = decodeParamsBounds.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /DecodeParms property value");
                        }
                        break;
                    case "/DL":
                        const dl = parser.parseNumberAt(i, false);
                        if (dl) {
                            this.DL = dl.value;
                            i = dl.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /DL property value");
                        }
                        break;
                    default:
                        i = parser.skipToNextName(i, lastBeforeStream);
                        break;
                }
            }
            else {
                break;
            }
        }
        const streamStart = parser.findNewLineIndex("straight", streamStartIndex.end + 1);
        const streamEnd = parser.findNewLineIndex("reverse", streamEndIndex.start - 1);
        const encodedData = parser.sliceCharCodes(streamStart, streamEnd);
        if (!this.Length || this.Length !== encodedData.length) {
            throw new Error("Incorrect stream length");
        }
        const decodedData = FlateDecoder.Decode(encodedData, (_a = this.DecodeParms) === null || _a === void 0 ? void 0 : _a.Predictor, (_b = this.DecodeParms) === null || _b === void 0 ? void 0 : _b.Columns, (_c = this.DecodeParms) === null || _c === void 0 ? void 0 : _c.Colors, (_d = this.DecodeParms) === null || _d === void 0 ? void 0 : _d.BitsPerComponent);
        this.streamData = decodedData;
        return true;
    }
}

class TrailerStream extends Stream {
    constructor() {
        super(streamTypes.XREF);
    }
    static parse(parser, bounds) {
        const trailer = new TrailerStream();
        const parseResult = trailer.tryParseProps(parser, bounds);
        return parseResult
            ? { value: trailer, start: bounds.start, end: bounds.end }
            : null;
    }
    toArray() {
        return new Uint8Array();
    }
    tryParseProps(parser, bounds) {
        const superIsParsed = super.tryParseProps(parser, bounds);
        if (!superIsParsed) {
            return false;
        }
        if (this.Type !== dictTypes.XREF) {
            return false;
        }
        const start = bounds.contentStart || bounds.start;
        const dictBounds = parser.getDictBoundsAt(start);
        let i = parser.skipToNextName(start, dictBounds.contentStart);
        if (i === -1) {
            return false;
        }
        let name;
        let parseResult;
        while (true) {
            parseResult = parser.parseNameAt(i);
            if (parseResult) {
                i = parseResult.end + 1;
                name = parseResult.value;
                switch (name) {
                    case "/Size":
                        const size = parser.parseNumberAt(i, false);
                        if (size) {
                            this.Size = size.value;
                            i = size.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Size property value");
                        }
                        break;
                    case "/Prev":
                        const prev = parser.parseNumberAt(i, false);
                        if (prev) {
                            this.Prev = prev.value;
                            i = prev.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Size property value");
                        }
                        break;
                    case "/Root":
                        const rootId = ObjectId.parseRef(parser, i);
                        if (rootId) {
                            this.Root = rootId.value;
                            i = rootId.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Root property value");
                        }
                        break;
                    case "/Encrypt":
                        const encryptId = ObjectId.parseRef(parser, i);
                        if (encryptId) {
                            this.Encrypt = encryptId.value;
                            i = encryptId.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Ebcrypt property value");
                        }
                        break;
                    case "/Info":
                        const infoId = ObjectId.parseRef(parser, i);
                        if (infoId) {
                            this.Info = infoId.value;
                            i = infoId.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Info property value");
                        }
                        break;
                    case "/ID":
                        const ids = parser.parseHexArrayAt(i);
                        if (ids) {
                            this.ID = [ids.value[0], ids.value[1]];
                            i = ids.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /ID property value");
                        }
                        break;
                    case "/Index":
                        const index = parser.parseNumberArrayAt(i);
                        if (index) {
                            this.Index = index.value;
                            i = index.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Index property value");
                        }
                        break;
                    case "/W":
                        const w = parser.parseNumberArrayAt(i);
                        if (w) {
                            this.W = [w.value[0], w.value[1], w.value[2]];
                            i = w.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /W property value");
                        }
                        break;
                    default:
                        i = parser.skipToNextName(i, dictBounds.contentEnd);
                        break;
                }
            }
            else {
                return true;
            }
        }
    }
}

class XRefStream extends XRef {
    constructor(trailer) {
        super(xRefTypes.STREAM);
        this._trailerStream = trailer;
    }
    static parse(parser, bounds) {
        if (!parser || !bounds) {
            return null;
        }
        const trailerStream = TrailerStream.parse(parser, bounds);
        if (!trailerStream) {
            return null;
        }
        const xrefStream = new XRefStream(trailerStream.value);
        console.log(xrefStream);
        return {
            value: xrefStream,
            start: null,
            end: null,
        };
    }
}

class XRefTable extends XRef {
    constructor(trailer) {
        super(xRefTypes.TABLE);
        this._trailerDict = trailer;
    }
    static parse(parser, index, skipEmpty = true) {
        return {
            value: new XRefTable(null),
            start: null,
            end: null,
        };
    }
}

class XRefParser {
    constructor(parser) {
        this._parser = parser;
    }
    parseNextXref() {
        const xrefStartIndex = this._parser.findSubarrayIndex(keywordCodes.XREF_START, { maxIndex: this._lastXRefStartIndex, direction: "reverse" });
        if (!xrefStartIndex) {
            return null;
        }
        const xrefIndex = this._parser.parseNumberAt(xrefStartIndex.end + 1);
        if (!xrefIndex) {
            return null;
        }
        console.log(xrefIndex.value);
        const xrefTableIndex = this._parser.findSubarrayIndex(keywordCodes.XREF_TABLE, { minIndex: xrefIndex.value, closedOnly: true });
        if (xrefTableIndex && xrefTableIndex.start === xrefIndex.value) {
            const xrefStmIndex = this._parser.findSubarrayIndex(keywordCodes.XREF_HYBRID, { minIndex: xrefIndex.value, maxIndex: xrefStartIndex.start, closedOnly: true });
            if (xrefStmIndex) {
                console.log("XRef is hybrid");
                return XRefHybrid.parse(this._parser, xrefIndex.value);
            }
            else {
                console.log("XRef is table");
                return XRefTable.parse(this._parser, xrefIndex.value);
            }
        }
        const id = ObjectId.parse(this._parser, xrefIndex.value, false);
        if (!id) {
            return null;
        }
        const xrefStreamBounds = this._parser.getIndirectObjectBoundsAt(id.end + 1);
        if (!xrefStreamBounds) {
            return null;
        }
        console.log("XRef is stream");
        return XRefStream.parse(this._parser, xrefStreamBounds);
    }
}

class Annotator {
    constructor(pdfData) {
        this.onAnnotationDictChange = {
            set: (target, prop, value) => true,
        };
        if (!(pdfData === null || pdfData === void 0 ? void 0 : pdfData.length)) {
            throw new Error("Data is empty");
        }
        this._sourceData = pdfData;
        this._parser = new Parser(pdfData);
        this._xrefParser = new XRefParser(this._parser);
        this.parseData();
    }
    get annotations() {
        return this._annotations.map(x => new Proxy(x, this.onAnnotationDictChange));
    }
    getRefinedData() {
        return null;
    }
    getExportedData() {
        return null;
    }
    addAnnotationDict(annotation) {
        this._annotations.push(annotation);
    }
    parseData() {
        var _a;
        this._version = this._parser.getPdfVersion();
        this._lastXref = (_a = this._xrefParser.parseNextXref()) === null || _a === void 0 ? void 0 : _a.value;
    }
    updateData() {
    }
    extractSupportedAnnotationDicts() {
    }
}

var __awaiter$2 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class TsPdfViewer {
    constructor(containerSelector, workerSrc) {
        this._visibleAdjPages = 0;
        this._previewWidth = 100;
        this._minScale = 0.25;
        this._maxScale = 4;
        this._scale = 1;
        this._previewerHidden = true;
        this._pages = [];
        this._currentPage = 0;
        this._mode = "normal";
        this._pointerInfo = {
            lastPos: null,
            downPos: null,
            downScroll: null,
        };
        this._timers = {
            hidePanels: 0,
        };
        this._pinchInfo = {
            active: false,
            lastDist: 0,
            minDist: 10,
            sensitivity: 0.025,
            target: null,
        };
        this.onPdfLoadingProgress = (progressData) => {
        };
        this.onPdfLoadedAsync = (doc) => __awaiter$2(this, void 0, void 0, function* () {
            this._pdfDocument = doc;
            yield this.refreshPagesAsync();
            this.renderVisiblePreviews();
            this.renderVisiblePages();
            this._shadowRoot.querySelector("#panel-bottom").classList.remove("disabled");
        });
        this.onPdfClosedAsync = () => __awaiter$2(this, void 0, void 0, function* () {
            this._shadowRoot.querySelector("#panel-bottom").classList.add("disabled");
            if (this._pdfDocument) {
                this._pdfDocument = null;
            }
            yield this.refreshPagesAsync();
        });
        this.onMainContainerResize = (entries, observer) => {
            const { width } = this._mainContainer.getBoundingClientRect();
            if (width < 721) {
                this._mainContainer.classList.add("mobile");
            }
            else {
                this._mainContainer.classList.remove("mobile");
            }
        };
        this.onHandToggleClick = () => {
            if (this._mode === "hand") {
                this._mode = "normal";
                this._viewer.classList.remove("hand");
                this._shadowRoot.querySelector("div#toggle-hand").classList.remove("on");
            }
            else {
                this._mode = "hand";
                this._viewer.classList.add("hand");
                this._shadowRoot.querySelector("div#toggle-hand").classList.add("on");
            }
        };
        this.onPreviewerToggleClick = () => {
            if (this._previewerHidden) {
                this._mainContainer.classList.remove("hide-previewer");
                this._shadowRoot.querySelector("div#toggle-previewer").classList.add("on");
                this._previewerHidden = false;
                setTimeout(() => this.renderVisiblePreviews(), 1000);
            }
            else {
                this._mainContainer.classList.add("hide-previewer");
                this._shadowRoot.querySelector("div#toggle-previewer").classList.remove("on");
                this._previewerHidden = true;
            }
        };
        this.onPreviewerPageClick = (e) => {
            let target = e.target;
            let pageNumber;
            while (target && !pageNumber) {
                const data = target.dataset["pageNumber"];
                if (data) {
                    pageNumber = +data;
                }
                else {
                    target = target.parentElement;
                }
            }
            if (pageNumber) {
                this.scrollToPage(pageNumber - 1);
            }
        };
        this.onPreviewerScroll = (e) => {
            this.renderVisiblePreviews();
        };
        this.onPaginatorInput = (event) => {
            if (event.target instanceof HTMLInputElement) {
                event.target.value = event.target.value.replace(/[^\d]+/g, "");
            }
        };
        this.onPaginatorChange = (event) => {
            if (event.target instanceof HTMLInputElement) {
                const pageNumber = Math.max(Math.min(+event.target.value, this._pdfDocument.numPages), 1);
                if (pageNumber + "" !== event.target.value) {
                    event.target.value = pageNumber + "";
                }
                this.scrollToPage(pageNumber - 1);
            }
        };
        this.onPaginatorPrevClick = () => {
            const pageNumber = clamp(this._currentPage - 1, 0, this._pages.length - 1);
            this.scrollToPage(pageNumber);
        };
        this.onPaginatorNextClick = () => {
            const pageNumber = clamp(this._currentPage + 1, 0, this._pages.length - 1);
            this.scrollToPage(pageNumber);
        };
        this.onZoomOutClick = () => {
            this.zoomOut();
        };
        this.onZoomInClick = () => {
            this.zoomIn();
        };
        this.onZoomFitViewerClick = () => {
            const cWidth = this._viewer.getBoundingClientRect().width;
            const pWidth = this._pages[this._currentPage].viewContainer.getBoundingClientRect().width;
            const scale = clamp((cWidth - 20) / pWidth * this._scale, this._minScale, this._maxScale);
            this.setScale(scale);
            this.scrollToPage(this._currentPage);
        };
        this.onZoomFitPageClick = () => {
            const { width: cWidth, height: cHeight } = this._viewer.getBoundingClientRect();
            const { width: pWidth, height: pHeight } = this._pages[this._currentPage].viewContainer.getBoundingClientRect();
            const hScale = clamp((cWidth - 20) / pWidth * this._scale, this._minScale, this._maxScale);
            const vScale = clamp((cHeight - 20) / pHeight * this._scale, this._minScale, this._maxScale);
            this.setScale(Math.min(hScale, vScale));
            this.scrollToPage(this._currentPage);
        };
        this.onViewerScroll = (e) => {
            this.renderVisiblePages();
        };
        this.onViewerPointerMove = (event) => {
            const { clientX, clientY } = event;
            const { x: rectX, y: rectY, width, height } = this._viewer.getBoundingClientRect();
            const l = clientX - rectX;
            const t = clientY - rectY;
            const r = width - l;
            const b = height - t;
            if (Math.min(l, r, t, b) > 100) {
                if (!this._panelsHidden && !this._timers.hidePanels) {
                    this._timers.hidePanels = setTimeout(() => {
                        this._mainContainer.classList.add("hide-panels");
                        this._panelsHidden = true;
                        this._timers.hidePanels = null;
                    }, 5000);
                }
            }
            else {
                if (this._timers.hidePanels) {
                    clearTimeout(this._timers.hidePanels);
                    this._timers.hidePanels = null;
                }
                if (this._panelsHidden) {
                    this._mainContainer.classList.remove("hide-panels");
                    this._panelsHidden = false;
                }
            }
            this._pointerInfo.lastPos = { x: clientX, y: clientY };
        };
        this.onViewerPointerDown = (event) => {
            if (this._mode !== "hand") {
                return;
            }
            const { clientX, clientY } = event;
            this._pointerInfo.downPos = { x: clientX, y: clientY };
            this._pointerInfo.downScroll = { x: this._viewer.scrollLeft, y: this._viewer.scrollTop };
            const onPointerMove = (moveEvent) => {
                const { x, y } = this._pointerInfo.downPos;
                const { x: left, y: top } = this._pointerInfo.downScroll;
                const dX = moveEvent.clientX - x;
                const dY = moveEvent.clientY - y;
                this._viewer.scrollTo(left - dX, top - dY);
            };
            const onPointerUp = (upEvent) => {
                this._pointerInfo.downPos = null;
                this._pointerInfo.downScroll = null;
                window.removeEventListener("pointermove", onPointerMove);
                window.removeEventListener("pointerup", onPointerUp);
                window.removeEventListener("pointerout", onPointerUp);
            };
            window.addEventListener("pointermove", onPointerMove);
            window.addEventListener("pointerup", onPointerUp);
            window.addEventListener("pointerout", onPointerUp);
        };
        this.onViewerTouchStart = (event) => {
            if (event.touches.length !== 2) {
                return;
            }
            const a = event.touches[0];
            const b = event.touches[1];
            this._pinchInfo.active = true;
            this._pinchInfo.lastDist = getDistance(a.clientX, a.clientY, b.clientX, b.clientY);
            const onTouchMove = (moveEvent) => {
                if (moveEvent.touches.length !== 2) {
                    return;
                }
                const mA = moveEvent.touches[0];
                const mB = moveEvent.touches[1];
                const dist = getDistance(mA.clientX, mA.clientY, mB.clientX, mB.clientY);
                const delta = dist - this._pinchInfo.lastDist;
                const factor = Math.floor(delta / this._pinchInfo.minDist);
                if (factor) {
                    const center = getCenter(mA.clientX, mA.clientY, mB.clientX, mB.clientY);
                    this._pinchInfo.lastDist = dist;
                    this.zoom(factor * this._pinchInfo.sensitivity, center);
                }
            };
            const onTouchEnd = (endEvent) => {
                this._pinchInfo.active = false;
                this._pinchInfo.lastDist = 0;
                event.target.removeEventListener("touchmove", onTouchMove);
                event.target.removeEventListener("touchend", onTouchEnd);
                event.target.removeEventListener("touchcancel", onTouchEnd);
            };
            event.target.addEventListener("touchmove", onTouchMove);
            event.target.addEventListener("touchend", onTouchEnd);
            event.target.addEventListener("touchcancel", onTouchEnd);
        };
        this.onViewerWheel = (event) => {
            if (!event.ctrlKey) {
                return;
            }
            event.preventDefault();
            if (event.deltaY > 0) {
                this.zoomOut(this._pointerInfo.lastPos);
            }
            else {
                this.zoomIn(this._pointerInfo.lastPos);
            }
        };
        const container = document.querySelector(containerSelector);
        if (!container) {
            throw new Error("Container not found");
        }
        else if (!(container instanceof HTMLDivElement)) {
            throw new Error("Container is not a DIV element");
        }
        else {
            this._outerContainer = container;
        }
        if (!workerSrc) {
            throw new Error("Worker source path not defined");
        }
        GlobalWorkerOptions.workerSrc = workerSrc;
        this.initViewerGUI();
    }
    destroy() {
        var _a, _b;
        (_a = this._pdfLoadingTask) === null || _a === void 0 ? void 0 : _a.destroy();
        this._pages.forEach(x => x.destroy());
        if (this._pdfDocument) {
            this._pdfDocument.cleanup();
            this._pdfDocument.destroy();
        }
        (_b = this._mainContainerResizeObserver) === null || _b === void 0 ? void 0 : _b.disconnect();
        this._shadowRoot.innerHTML = "";
    }
    openPdfAsync(src) {
        return __awaiter$2(this, void 0, void 0, function* () {
            let data;
            let doc;
            try {
                if (src instanceof Uint8Array) {
                    data = src;
                }
                else {
                    let blob;
                    if (typeof src === "string") {
                        const res = yield fetch(src);
                        blob = yield res.blob();
                    }
                    else {
                        blob = src;
                    }
                    const buffer = yield blob.arrayBuffer();
                    data = new Uint8Array(buffer);
                }
            }
            catch (_a) {
                throw new Error("Cannot load file data!");
            }
            const annotator = new Annotator(data);
            try {
                if (this._pdfLoadingTask) {
                    yield this.closePdfAsync();
                    return this.openPdfAsync(data);
                }
                this._pdfLoadingTask = getDocument(data);
                this._pdfLoadingTask.onProgress = this.onPdfLoadingProgress;
                doc = yield this._pdfLoadingTask.promise;
                this._pdfLoadingTask = null;
            }
            catch (_b) {
                throw new Error("Cannot open PDF!");
            }
            yield this.onPdfLoadedAsync(doc);
        });
    }
    closePdfAsync() {
        return __awaiter$2(this, void 0, void 0, function* () {
            if (this._pdfLoadingTask) {
                if (!this._pdfLoadingTask.destroyed) {
                    yield this._pdfLoadingTask.destroy();
                }
                this._pdfLoadingTask = null;
            }
            yield this.onPdfClosedAsync();
        });
    }
    initViewerGUI() {
        this._shadowRoot = this._outerContainer.attachShadow({ mode: "open" });
        this._shadowRoot.innerHTML = styles + html;
        const paginatorInput = this._shadowRoot.getElementById("paginator-input");
        paginatorInput.addEventListener("input", this.onPaginatorInput);
        paginatorInput.addEventListener("change", this.onPaginatorChange);
        this._shadowRoot.querySelector("#paginator-prev").addEventListener("click", this.onPaginatorPrevClick);
        this._shadowRoot.querySelector("#paginator-next").addEventListener("click", this.onPaginatorNextClick);
        this._shadowRoot.querySelector("#zoom-out").addEventListener("click", this.onZoomOutClick);
        this._shadowRoot.querySelector("#zoom-in").addEventListener("click", this.onZoomInClick);
        this._shadowRoot.querySelector("#zoom-fit-viewer").addEventListener("click", this.onZoomFitViewerClick);
        this._shadowRoot.querySelector("#zoom-fit-page").addEventListener("click", this.onZoomFitPageClick);
        this._shadowRoot.querySelector("div#toggle-previewer").addEventListener("click", this.onPreviewerToggleClick);
        this._shadowRoot.querySelector("div#toggle-hand").addEventListener("click", this.onHandToggleClick);
        this._previewer = this._shadowRoot.querySelector("div#previewer");
        this._previewer.addEventListener("scroll", this.onPreviewerScroll);
        this._viewer = this._shadowRoot.querySelector("div#viewer");
        this._viewer.addEventListener("scroll", this.onViewerScroll);
        this._viewer.addEventListener("wheel", this.onViewerWheel);
        this._viewer.addEventListener("pointermove", this.onViewerPointerMove);
        this._viewer.addEventListener("pointerdown", this.onViewerPointerDown);
        this._viewer.addEventListener("touchstart", this.onViewerTouchStart);
        this._mainContainer = this._shadowRoot.querySelector("div#main-container");
        const resizeObserver = new ResizeObserver(this.onMainContainerResize);
        resizeObserver.observe(this._mainContainer);
        this._mainContainerResizeObserver = resizeObserver;
    }
    refreshPagesAsync() {
        var _a;
        return __awaiter$2(this, void 0, void 0, function* () {
            this._pages.forEach(x => {
                x.previewContainer.removeEventListener("click", this.onPreviewerPageClick);
                x.destroy();
            });
            this._pages.length = 0;
            const docPagesNumber = ((_a = this._pdfDocument) === null || _a === void 0 ? void 0 : _a.numPages) || 0;
            this._shadowRoot.getElementById("paginator-total").innerHTML = docPagesNumber + "";
            if (!docPagesNumber) {
                return;
            }
            for (let i = 0; i < docPagesNumber; i++) {
                const pageProxy = yield this._pdfDocument.getPage(i + 1);
                const page = new ViewPage(pageProxy, this._maxScale, this._previewWidth);
                page.scale = this._scale;
                page.previewContainer.addEventListener("click", this.onPreviewerPageClick);
                this._previewer.append(page.previewContainer);
                this._viewer.append(page.viewContainer);
                this._pages.push(page);
            }
        });
    }
    renderVisiblePreviews() {
        if (this._previewerHidden) {
            return;
        }
        const pages = this._pages;
        const visiblePreviewNumbers = this.getVisiblePages(this._previewer, pages, true);
        const minPageNumber = Math.max(Math.min(...visiblePreviewNumbers) - this._visibleAdjPages, 0);
        const maxPageNumber = Math.min(Math.max(...visiblePreviewNumbers) + this._visibleAdjPages, pages.length - 1);
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            if (i >= minPageNumber && i <= maxPageNumber) {
                page.renderPreviewAsync();
            }
        }
    }
    renderVisiblePages() {
        var _a, _b;
        const pages = this._pages;
        const visiblePageNumbers = this.getVisiblePages(this._viewer, pages);
        const prevCurrent = this._currentPage;
        const current = this.getCurrentPage(this._viewer, pages, visiblePageNumbers);
        if (!prevCurrent || prevCurrent !== current) {
            (_a = pages[prevCurrent]) === null || _a === void 0 ? void 0 : _a.previewContainer.classList.remove("current");
            (_b = pages[current]) === null || _b === void 0 ? void 0 : _b.previewContainer.classList.add("current");
            this._shadowRoot.getElementById("paginator-input").value = current + 1 + "";
            this.scrollToPreview(current);
            this._currentPage = current;
        }
        if (current === -1) {
            return;
        }
        const minPageNumber = Math.max(Math.min(...visiblePageNumbers) - this._visibleAdjPages, 0);
        const maxPageNumber = Math.min(Math.max(...visiblePageNumbers) + this._visibleAdjPages, pages.length - 1);
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            if (i >= minPageNumber && i <= maxPageNumber) {
                page.renderViewAsync();
            }
            else {
                page.clearView();
            }
        }
    }
    scrollToPreview(pageNumber) {
        const { top: cTop, height: cHeight } = this._previewer.getBoundingClientRect();
        const { top: pTop, height: pHeight } = this._pages[pageNumber].previewContainer.getBoundingClientRect();
        const cCenter = cTop + cHeight / 2;
        const pCenter = pTop + pHeight / 2;
        const scroll = pCenter - cCenter + this._previewer.scrollTop;
        this._previewer.scrollTo(0, scroll);
    }
    scrollToPage(pageNumber) {
        const { top: cTop } = this._viewer.getBoundingClientRect();
        const { top: pTop } = this._pages[pageNumber].viewContainer.getBoundingClientRect();
        const scroll = pTop - (cTop - this._viewer.scrollTop);
        this._viewer.scrollTo(this._viewer.scrollLeft, scroll);
    }
    setScale(scale, cursorPosition = null) {
        if (!scale || scale === this._scale) {
            return;
        }
        let pageContainerUnderPivot;
        let xPageRatio;
        let yPageRatio;
        if (cursorPosition) {
            for (const page of this._pages) {
                const { x: x, y: y } = cursorPosition;
                const { x: pX, y: pY, width: pWidth, height: pHeight } = page.viewContainer.getBoundingClientRect();
                if (pX <= x
                    && pX + pWidth >= x
                    && pY <= y
                    && pY + pHeight >= y) {
                    pageContainerUnderPivot = page.viewContainer;
                    xPageRatio = (x - pX) / pWidth;
                    yPageRatio = (y - pY) / pHeight;
                    break;
                }
            }
        }
        this._scale = scale;
        this._pages.forEach(x => x.scale = this._scale);
        if (pageContainerUnderPivot
            &&
                (this._viewer.scrollHeight > this._viewer.clientHeight
                    || this._viewer.scrollWidth > this._viewer.clientWidth)) {
            const { x: initialX, y: initialY } = cursorPosition;
            const { x: pX, y: pY, width: pWidth, height: pHeight } = pageContainerUnderPivot.getBoundingClientRect();
            const resultX = pX + (pWidth * xPageRatio);
            const resultY = pY + (pHeight * yPageRatio);
            let scrollLeft = this._viewer.scrollLeft + (resultX - initialX);
            let scrollTop = this._viewer.scrollTop + (resultY - initialY);
            scrollLeft = scrollLeft < 0
                ? 0
                : scrollLeft;
            scrollTop = scrollTop < 0
                ? 0
                : scrollTop;
            if (scrollTop !== this._viewer.scrollTop
                || scrollLeft !== this._viewer.scrollLeft) {
                this._viewer.scrollTo(scrollLeft, scrollTop);
                return;
            }
        }
        setTimeout(() => this.renderVisiblePages(), 0);
    }
    zoom(diff, cursorPosition = null) {
        const scale = clamp(this._scale + diff, this._minScale, this._maxScale);
        this.setScale(scale, cursorPosition || this.getViewerCenterPosition());
    }
    zoomOut(cursorPosition = null) {
        this.zoom(-0.25, cursorPosition);
    }
    zoomIn(cursorPosition = null) {
        this.zoom(0.25, cursorPosition);
    }
    getViewerCenterPosition() {
        const { x, y, width, height } = this._viewer.getBoundingClientRect();
        return {
            x: x + width / 2,
            y: y + height / 2,
        };
    }
    getVisiblePages(container, pages, preview = false) {
        const pagesVisible = new Set();
        if (!pages.length) {
            return pagesVisible;
        }
        const cRect = container.getBoundingClientRect();
        const cTop = cRect.top;
        const cBottom = cRect.top + cRect.height;
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            const pRect = preview
                ? page.previewContainer.getBoundingClientRect()
                : page.viewContainer.getBoundingClientRect();
            const pTop = pRect.top;
            const pBottom = pRect.top + pRect.height;
            if (pTop < cBottom && pBottom > cTop) {
                pagesVisible.add(i);
            }
            else if (pagesVisible.size) {
                break;
            }
        }
        return pagesVisible;
    }
    getCurrentPage(container, pages, visiblePageNumbers) {
        const visiblePageNumbersArray = [...visiblePageNumbers];
        if (!visiblePageNumbersArray.length) {
            return -1;
        }
        else if (visiblePageNumbersArray.length === 1) {
            return visiblePageNumbersArray[0];
        }
        const cRect = container.getBoundingClientRect();
        const cTop = cRect.top;
        const cMiddle = cRect.top + cRect.height / 2;
        for (const i of visiblePageNumbersArray) {
            const pRect = pages[i].viewContainer.getBoundingClientRect();
            const pTop = pRect.top;
            if (pTop > cTop) {
                if (pTop > cMiddle) {
                    return i - 1;
                }
                else {
                    return i;
                }
            }
        }
        throw new Error("Incorrect argument");
    }
}

export { TsPdfViewer };
