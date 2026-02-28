
import prettier from 'prettier/standalone';
import parserHtml from 'prettier/parser-html';
import parserCss from 'prettier/parser-postcss';
import parserBabel from 'prettier/parser-babel';
import parserEstree from 'prettier/plugins/estree';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { code, language } = await request.json();

    if (!code) {
      return new Response(JSON.stringify({ error: 'Code is required' }), { status: 400 });
    }

    let parser = '';
    let plugins: any[] = [];

    switch (language) {
      case 'html':
        parser = 'html';
        plugins = [parserHtml, parserCss, parserBabel]; // HTML parser needs CSS/JS parsers for embedded code
        break;
      case 'css':
        parser = 'css';
        plugins = [parserCss];
        break;
      case 'javascript':
        parser = 'babel';
        plugins = [parserBabel, parserEstree];
        break;
      default:
        return new Response(JSON.stringify({ error: 'Unsupported language' }), { status: 400 });
    }

    const formattedCode = await prettier.format(code, {
      parser,
      plugins,
      printWidth: 80,
      tabWidth: 2,
      useTabs: false,
      semi: true,
      singleQuote: false,
    });

    return new Response(JSON.stringify({
      formattedCode
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Formatting failed' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
