import {
  Children,
  cloneElement,
  isValidElement,
  type ReactNode,
} from "react"
import { useLanguage } from "../domain/store"
import { translate } from "../i18n"

const translatedAttributes = ["aria-label", "placeholder", "title"] as const

function localize(node: ReactNode, language: "en" | "my"): ReactNode {
  if (typeof node === "string") {
    return translate(node.trim(), language === "my" ? "MY" : "EN") === node.trim()
      ? node
      : node.replace(node.trim(), translate(node.trim(), "MY"))
  }
  if (Array.isArray(node)) {
    return Children.map(node, (child) => localize(child, language))
  }
  if (!isValidElement<Record<string, unknown>>(node)) return node

  const props: Record<string, unknown> = {}
  for (const attribute of translatedAttributes) {
    const value = node.props[attribute]
    if (typeof value === "string") {
      props[attribute] = translate(value, language === "my" ? "MY" : "EN")
    }
  }
  if ("children" in node.props) {
    props.children = localize(node.props.children as ReactNode, language)
  }
  return cloneElement(node, props)
}

export function LocalizedContent({ children }: { children: ReactNode }) {
  const language = useLanguage()
  return <>{localize(children, language)}</>
}
