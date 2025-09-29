import { createErrorResponse, ToolResult } from '@/common/tool-handler';
import { BaseBrowserToolExecutor } from '../base-browser';
import { TOOL_NAMES } from 'chrome-mcp-shared';
import { TOOL_MESSAGE_TYPES } from '@/common/message-types';

interface AbstractWebToolParams {
  url?: string; // optional URL to fetch content from (if not provided, uses active tab)
  selector?: string; // optional CSS selector to get content from a specific element
}

class AbstractWebTool extends BaseBrowserToolExecutor {
  name = TOOL_NAMES.BROWSER.ABSTRACT_WEB;

  /**
   * Execute abstract web content extraction operation
   */
  async execute(args: AbstractWebToolParams): Promise<ToolResult> {
    const url = args.url;
    const selector = args.selector;

    console.log(`Starting abstract web content extraction with options:`, {
      url,
      selector,
    });

    try {
      let tab;

      if (url) {
        console.log(`Checking if URL is already open: ${url}`);
        const allTabs = await chrome.tabs.query({});

        const matchingTabs = allTabs.filter((t) => {
          const tabUrl = t.url?.endsWith('/') ? t.url.slice(0, -1) : t.url;
          const targetUrl = url.endsWith('/') ? url.slice(0, -1) : url;
          return tabUrl === targetUrl;
        });

        if (matchingTabs.length > 0) {
          tab = matchingTabs[0];
          console.log(`Found existing tab with URL: ${url}, tab ID: ${tab.id}`);
        } else {
          console.log(`No existing tab found with URL: ${url}, creating new tab`);
          tab = await chrome.tabs.create({ url, active: true });
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      } else {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tabs[0]) {
          return createErrorResponse('No active tab found');
        }
        tab = tabs[0];
      }

      if (!tab.id) {
        return createErrorResponse('Tab has no ID');
      }

      await chrome.tabs.update(tab.id, { active: true });

      await this.injectContentScript(tab.id, ['inject-scripts/abstract-web-helper.js']);

      const abstractContentResponse = await this.sendMessageToTab(tab.id, {
        action: TOOL_MESSAGE_TYPES.ABSTRACT_WEB_GET_CONTENT,
        selector: selector,
      });

      if (abstractContentResponse.success) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                abstractContent: abstractContentResponse.abstractContent,
                url: tab.url,
                title: tab.title,
              }),
            },
          ],
          isError: false,
        };
      } else {
        console.error('Failed to get abstract web content:', abstractContentResponse.error);
        return createErrorResponse(
          abstractContentResponse.error || 'Failed to get abstract web content',
        );
      }
    } catch (error) {
      console.error('Error in abstract web content extraction:', error);
      return createErrorResponse(
        `Error extracting abstract web content: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

export const abstractWebTool = new AbstractWebTool();
