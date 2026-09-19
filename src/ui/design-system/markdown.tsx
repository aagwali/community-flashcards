import DOMPurify from 'dompurify'
import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import csharp from 'highlight.js/lib/languages/csharp'
import java from 'highlight.js/lib/languages/java'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import python from 'highlight.js/lib/languages/python'
import sql from 'highlight.js/lib/languages/sql'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import { marked } from 'marked'
import { useEffect, useMemo, useRef } from 'react'
import { cx } from './primitives'

/**
 * On n'enregistre que les langages qu'on écrit réellement : le bundle complet
 * de highlight.js pèse plus lourd que toute l'application.
 */
for (const [name, language] of Object.entries({
  bash,
  csharp,
  java,
  javascript,
  json,
  python,
  sql,
  typescript,
  xml,
})) {
  hljs.registerLanguage(name, language)
}

hljs.registerAliases(['ts'], { languageName: 'typescript' })
hljs.registerAliases(['js'], { languageName: 'javascript' })
hljs.registerAliases(['sh', 'shell'], { languageName: 'bash' })
hljs.registerAliases(['html'], { languageName: 'xml' })

marked.use({ gfm: true, breaks: false })

interface MarkdownProps {
  source: string
  className?: string
}

/**
 * Le contenu vient du dépôt (relu en Pull Request) ou de l'éditeur local, mais
 * il finit en `innerHTML` : on le passe malgré tout par DOMPurify. Le jour où
 * quelqu'un colle un extrait trouvé en ligne, ça ne coûte rien d'avoir eu tort
 * d'être prudent.
 */
export function Markdown({ source, className }: MarkdownProps) {
  const container = useRef<HTMLDivElement>(null)

  const html = useMemo(() => DOMPurify.sanitize(marked.parse(source, { async: false })), [source])

  useEffect(() => {
    const blocks = container.current?.querySelectorAll<HTMLElement>('pre code')
    blocks?.forEach((block) => {
      delete block.dataset['highlighted']
      hljs.highlightElement(block)
    })
  }, [html])

  return <div ref={container} className={cx('prose', className)} dangerouslySetInnerHTML={{ __html: html }} />
}
