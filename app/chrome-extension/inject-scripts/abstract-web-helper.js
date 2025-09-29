import { TOOL_MESSAGE_TYPES } from '@/common/message-types';
import { setupContentScriptMessageHandler } from './inject-bridge';

function getAbstractWebContent(selector?: string): string {
  const targetElement = selector ? document.querySelector(selector) : document.body;
  if (!targetElement) {
    return '';
  }

  let abstractContent = '';

  function traverse(node: Node, indentLevel: number) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      const text = node.textContent.trim();
      // Check if the text is visible
      const parentElement = node.parentElement;
      if (parentElement) {
        const style = window.getComputedStyle(parentElement);
        if (style.display === 'none' || style.visibility === 'hidden') {
          return;
        }
      }
      abstractContent += '  '.repeat(indentLevel) + text + '\n';
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      // Skip script, style, and other non-visual elements
      if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'IMG', 'SVG', 'CANVAS', 'HEAD'].includes(element.tagName)) {
        return;
      }

      // Increase indent level for block-level elements or elements that typically introduce new lines
      const display = window.getComputedStyle(element).display;
      const isBlock = ['block', 'list-item', 'flex', 'grid', 'table'].includes(display);

      // Add a newline before block elements if there's content already
      if (isBlock && abstractContent.length > 0 && !abstractContent.endsWith('\n')) {
        abstractContent += '\n';
      }

      for (const child of Array.from(element.childNodes)) {
        traverse(child, isBlock ? indentLevel + 1 : indentLevel);
      }

      // Add a newline after block elements
      if (isBlock && abstractContent.length > 0 && !abstractContent.endsWith('\n')) {
        abstractContent += '\n';
      }
    }
  }

  traverse(targetElement, 0);
  return abstractContent.trim();
}

setupContentScriptMessageHandler(async (message) => {
  if (message.action === TOOL_MESSAGE_TYPES.ABSTRACT_WEB_GET_CONTENT) {
    try {
      const abstractContent = getAbstractWebContent(message.selector);
      return { success: true, abstractContent };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
});
