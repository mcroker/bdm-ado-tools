import * as nunjucks from 'nunjucks';

export async function njk(template: string, context: object = {}): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
        nunjucks.configure({
            autoescape: false
        });
        console.log(__dirname);
        const env = new nunjucks.Environment(
            new nunjucks.FileSystemLoader(__dirname + '/../templates'), { autoescape: false }
        );

        env.addFilter('yesno', function (b: boolean) {
            if (b) {
                return 'Yes'
            } else {
                return 'No'
            }
        });

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