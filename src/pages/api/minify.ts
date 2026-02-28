
import type { APIRoute } from 'astro';
import { minify } from 'html-minifier-terser';

export const POST: APIRoute = async ({ request }) => {
  const startTime = performance.now();
  
  try {
    const { code, language } = await request.json();
    
    if (!code) {
      return new Response(JSON.stringify({ error: 'Code is required' }), { status: 400 });
    }

    let minifiedCode = '';
    const originalSize = new TextEncoder().encode(code).length;

    const commonOptions = {
      collapseWhitespace: true,
      removeComments: true,
      minifyCSS: true,
      minifyJS: true,
      ignoreCustomFragments: [ /<%.*?%>/, /<\?.*?\?>/ ]
    };

    switch (language) {
      case 'html':
        minifiedCode = await minify(code, commonOptions);
        break;
      
      case 'css':
        // Wrap CSS in style tag to leverage html-minifier-terser's CSS minification
        const wrappedCss = `<style>${code}</style>`;
        const minifiedCss = await minify(wrappedCss, commonOptions);
        // Extract content between <style> tags
        minifiedCode = minifiedCss.replace(/^<style[^>]*>/i, '').replace(/<\/style>$/i, '');
        break;
      
      case 'javascript':
        // Wrap JS in script tag to leverage html-minifier-terser's JS minification
        const wrappedJs = `<script>${code}</script>`;
        const minifiedJs = await minify(wrappedJs, commonOptions);
        // Extract content between <script> tags
        minifiedCode = minifiedJs.replace(/^<script[^>]*>/i, '').replace(/<\/script>$/i, '');
        break;
        
      default:
        return new Response(JSON.stringify({ error: 'Unsupported language' }), { status: 400 });
    }

    const endTime = performance.now();
    const processingTime = (endTime - startTime).toFixed(2);
    const minifiedSize = new TextEncoder().encode(minifiedCode).length;
    const compressionRate = originalSize > 0 
      ? ((originalSize - minifiedSize) / originalSize * 100).toFixed(2) 
      : '0.00';

    return new Response(JSON.stringify({
      minifiedCode,
      stats: {
        originalSize,
        minifiedSize,
        processingTime, // ms
        compressionRate
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Minification failed' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
