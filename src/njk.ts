import * as nunjucks from 'nunjucks';

/**
 * Use a njk template to render a string
 * 
 * @param template Template file to use, relative to the templates directory
 * @param context  Context data for the njk template generation
 * @returns        Rendered string
 */
export async function njk(template: string, context: object = {}): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
        nunjucks.configure({
            autoescape: false
        });
        const env = new nunjucks.Environment(
            new nunjucks.FileSystemLoader(__dirname + '/../templates'), { autoescape: false }
        );

        // Joins a string array with a comma and space
        env.addFilter('join', function (b: (string | number)[]) {
            return (b || []).map(i => `${i}`).join(', ');
        });

        env.render(template, context,
            (err: Error | null, res: string | null) => {
                if (err || res === null) {
                    reject(err);
                } else {
                    resolve(res);
                }
            }
        );
    });
}