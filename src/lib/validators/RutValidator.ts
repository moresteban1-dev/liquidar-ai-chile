/**
 * NASA-Grade Reusable Chilean RUT (Rol Único Tributario) Validator and Formatter.
 * Adheres strictly to Modulo 11 algorithm.
 */
export class RutValidator {
    /**
     * Cleans a RUT string by removing dots, hyphens, and spaces, and converting 'k' to uppercase.
     */
    public static clean(rut: string): string {
        if (!rut || typeof rut !== 'string') return '';
        return rut.replace(/[^0-9kK]/g, '').toUpperCase();
    }

    /**
     * Validates a Chilean RUT using the Modulo 11 verification algorithm.
     */
    public static validate(rut: string): boolean {
        if (!rut || typeof rut !== 'string') return false;

        const cleanRut = this.clean(rut);
        if (cleanRut.length < 2) return false;

        const body = cleanRut.slice(0, -1);
        const dv = cleanRut.slice(-1);

        if (!/^\d+$/.test(body)) return false;

        let sum = 0;
        let multiplier = 2;

        for (let i = body.length - 1; i >= 0; i--) {
            sum += parseInt(body.charAt(i), 10) * multiplier;
            multiplier = multiplier === 7 ? 2 : multiplier + 1;
        }

        const expectedDvNum = 11 - (sum % 11);
        let expectedDv = '0';
        if (expectedDvNum === 10) {
            expectedDv = 'K';
        } else if (expectedDvNum !== 11) {
            expectedDv = String(expectedDvNum);
        }

        return expectedDv === dv;
    }

    /**
     * Formats a clean or dirty RUT string into the standard format: XX.XXX.XXX-X
     */
    public static format(rut: string): string {
        const cleanRut = this.clean(rut);
        if (cleanRut.length < 2) return cleanRut;

        const body = cleanRut.slice(0, -1);
        const dv = cleanRut.slice(-1);

        let formattedBody = '';
        let count = 0;

        for (let i = body.length - 1; i >= 0; i--) {
            formattedBody = body.charAt(i) + formattedBody;
            count++;
            if (count % 3 === 0 && i !== 0) {
                formattedBody = '.' + formattedBody;
            }
        }

        return `${formattedBody}-${dv}`;
    }
}
