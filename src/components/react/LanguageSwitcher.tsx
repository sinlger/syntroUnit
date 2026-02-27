import * as React from "react"
import { Languages } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { languages } from "../../i18n/ui"

interface LanguageSwitcherProps {
  currentLang: string
  url: string
}

export function LanguageSwitcher({ currentLang, url }: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  // Calculate paths for other languages
  const getPathForLang = (targetLang: string) => {
    const pathname = new URL(url).pathname
    const parts = pathname.split('/').filter(Boolean)
    const currentLangPart = parts[0]
    
    // If current path starts with a language code
    if (currentLangPart in languages) {
      parts[0] = targetLang
    } else {
      parts.unshift(targetLang)
    }
    
    return `/${parts.join('/')}`
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full text-slate-500 hover:bg-slate-100">
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(languages).map(([lang, label]) => (
          <DropdownMenuItem key={lang} asChild>
            <a 
              href={getPathForLang(lang)}
              className={currentLang === lang ? "bg-accent text-accent-foreground" : ""}
              data-astro-prefetch
            >
              {label}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
