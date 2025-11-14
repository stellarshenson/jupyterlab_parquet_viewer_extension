import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
  IDocumentWidget,
  DocumentRegistry,
  ABCWidgetFactory
} from '@jupyterlab/docregistry';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { TabularDataViewer } from './widget';
import { TabularDataDocument } from './document';

/**
 * A widget factory for Parquet files
 */
class TabularDataWidgetFactory extends ABCWidgetFactory<
  IDocumentWidget<TabularDataViewer>
> {
  private _setLastContextMenuRow: (row: any) => void;
  private _setActiveWidget: (widget: TabularDataViewer) => void;
  private _getSettings: () => ISettings;

  constructor(
    options: DocumentRegistry.IWidgetFactoryOptions,
    setLastContextMenuRow: (row: any) => void,
    setActiveWidget: (widget: TabularDataViewer) => void,
    getSettings: () => ISettings
  ) {
    super(options);
    this._setLastContextMenuRow = setLastContextMenuRow;
    this._setActiveWidget = setActiveWidget;
    this._getSettings = getSettings;
  }

  /**
   * Create a new widget given a context
   */
  protected createNewWidget(
    context: DocumentRegistry.Context
  ): IDocumentWidget<TabularDataViewer> {
    // console.log(`[Tabular Data Viewer] Creating widget for file: ${context.path}`);
    // console.log(`[Tabular Data Viewer] File type: ${context.contentsModel?.type}, Format: ${context.contentsModel?.format}`);

    const settings = this._getSettings();
    const content = new TabularDataViewer(context.path, this._setLastContextMenuRow, settings.maxCellCharacters);
    const widget = new TabularDataDocument({ content, context });
    widget.title.label = context.path.split('/').pop() || 'Tabular Data File';

    // Listen to context fileChanged signal to refresh data when file is reverted
    context.fileChanged.connect(() => {
      console.log('[Tabular Data Viewer] File changed, refreshing data');
      content.refresh();
    });

    // Track this as the active widget when context menu is used
    this._setActiveWidget(content);

    return widget;
  }
}

/**
 * Settings interface
 */
interface ISettings {
  enableParquet: boolean;
  enableExcel: boolean;
  enableCSV: boolean;
  enableTSV: boolean;
  maxCellCharacters: number;
}

/**
 * Initialization data for the jupyterlab_tabular_data_viewer_extension extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_tabular_data_viewer_extension:plugin',
  description:
    'Jupyterlab extension to allow simple browsing of tabular data files (Parquet, Excel) with filtering and sorting capabilities',
  autoStart: true,
  requires: [ISettingRegistry],
  activate: async (app: JupyterFrontEnd, settingRegistry: ISettingRegistry) => {
    console.log(
      'JupyterLab extension jupyterlab_tabular_data_viewer_extension is activated!'
    );

    const { docRegistry, commands, contextMenu } = app;

    // Track last right-clicked row for context menu
    let lastContextMenuRow: any = null;
    let activeWidget: TabularDataViewer | null = null;

    // Load settings
    let settings: ISettings = {
      enableParquet: true,
      enableExcel: true,
      enableCSV: true,
      enableTSV: true,
      maxCellCharacters: 100
    };

    // console.log('[Tabular Data Viewer] Default settings:', settings);

    try {
      // console.log('[Tabular Data Viewer] Loading settings from registry with id:', plugin.id);
      const pluginSettings = await settingRegistry.load(plugin.id);
      settings = pluginSettings.composite as unknown as ISettings;
      // console.log('[Tabular Data Viewer] Loaded settings:', settings);
      // console.log('[Tabular Data Viewer] Settings detail - enableParquet:', settings.enableParquet, 'enableExcel:', settings.enableExcel);

      // Watch for settings changes
      pluginSettings.changed.connect(() => {
        settings = pluginSettings.composite as unknown as ISettings;
        // console.log('[Tabular Data Viewer] Settings changed:', settings);
      });
    } catch (error) {
      console.error('[Tabular Data Viewer] Failed to load settings:', error);
      // console.log('[Tabular Data Viewer] Using default settings:', settings);
    }

    // Override the refresh view extension command for tabular data viewers
    // This replaces the generic "Refresh View" with tabular-specific refresh
    const refreshCommand = 'jupyterlab_refresh_view:refresh';

    // Override with tabular data specific implementation
    if (commands.hasCommand(refreshCommand)) {
      // Command already exists, we need to update it
      const existingCommand = (commands as any)._commands.get(refreshCommand);
      const originalExecute = existingCommand.execute;

      existingCommand.execute = async (args?: any) => {
        // Check if current widget is a tabular data viewer
        const currentWidget = app.shell.currentWidget;
        if (currentWidget && activeWidget &&
            currentWidget.node.contains(activeWidget.node)) {
          // Current widget contains our tabular viewer, use our refresh
          await activeWidget.refresh();
        } else {
          // Otherwise, fall back to original behavior
          await originalExecute.call(existingCommand, args);
        }
      };
    } else {
      // Command doesn't exist yet, create it
      commands.addCommand(refreshCommand, {
        label: 'Refresh View',
        caption: 'Refresh the current document view',
        isEnabled: () => {
          // Enable for any document (let the refresh view extension handle this)
          return true;
        },
        execute: async () => {
          const currentWidget = app.shell.currentWidget;
          if (currentWidget && activeWidget &&
              currentWidget.node.contains(activeWidget.node)) {
            await activeWidget.refresh();
          }
        }
      });
    }

    // Command to copy row as JSON
    const copyRowCommand = 'tabular-data-viewer:copy-row-json';
    commands.addCommand(copyRowCommand, {
      label: 'Copy Row as JSON',
      caption: 'Copy the row data as JSON to clipboard',
      isEnabled: () => {
        return lastContextMenuRow !== null;
      },
      execute: async () => {
        if (lastContextMenuRow) {
          // Filter out internal metadata fields before copying
          const { __row_index__, ...rowData } = lastContextMenuRow;
          const jsonString = JSON.stringify(rowData, null, 2);
          await navigator.clipboard.writeText(jsonString);
          // console.log('Row copied to clipboard as JSON');

          // Clean up highlight after copy
          if (activeWidget) {
            activeWidget.getCleanupHighlight()();
          }
        }
      }
    });

    // Note: We don't add a separate context menu item for refresh because we're
    // overriding the existing 'jupyterlab_refresh_view:refresh' command.
    // The refresh view extension already adds this to the context menu.

    // Add to context menu for tabular data viewer rows
    contextMenu.addItem({
      command: copyRowCommand,
      selector: '.jp-TabularDataViewer-row',
      rank: 10
    });

    // Register file types based on settings
    // console.log('[Tabular Data Viewer] Starting file type registration...');
    // console.log('[Tabular Data Viewer] Current settings state:', settings);
    const binaryFileTypes: string[] = [];
    const textFileTypes: string[] = [];

    // Register Parquet file type if enabled
    if (settings.enableParquet) {
      try {
        docRegistry.addFileType({
          name: 'parquet',
          displayName: 'Parquet',
          extensions: ['.parquet'],
          mimeTypes: ['application/x-parquet'],
          iconClass: 'jp-MaterialIcon jp-SpreadsheetIcon',
          contentType: 'file',
          fileFormat: 'base64'
        });
        binaryFileTypes.push('parquet');
        // console.log('[Tabular Data Viewer] Parquet file type registered');
      } catch (e) {
        console.warn('[Tabular Data Viewer] Parquet file type already registered', e);
      }
    }

    // Register Excel file type if enabled
    if (settings.enableExcel) {
      try {
        docRegistry.addFileType({
          name: 'xlsx-parquet-viewer',
          displayName: 'Excel (Parquet Viewer)',
          extensions: ['.xlsx'],
          mimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
          iconClass: 'jp-MaterialIcon jp-SpreadsheetIcon',
          contentType: 'file',
          fileFormat: 'base64'
        });
        binaryFileTypes.push('xlsx-parquet-viewer');
        // console.log('[Tabular Data Viewer] Excel file type registered');
      } catch (e) {
        console.warn('[Tabular Data Viewer] Excel file type already registered', e);
      }
    }

    // Register CSV file type if enabled
    if (settings.enableCSV) {
      try {
        docRegistry.addFileType({
          name: 'csv-tabular-viewer',
          displayName: 'CSV (Tabular Viewer)',
          extensions: ['.csv'],
          mimeTypes: ['text/csv'],
          iconClass: 'jp-MaterialIcon jp-SpreadsheetIcon',
          contentType: 'file',
          fileFormat: 'text'
        });
        textFileTypes.push('csv-tabular-viewer');
        // console.log('[Tabular Data Viewer] CSV file type registered');
      } catch (e) {
        console.warn('[Tabular Data Viewer] CSV file type already registered', e);
      }
    }

    // Register TSV file type if enabled
    if (settings.enableTSV) {
      try {
        docRegistry.addFileType({
          name: 'tsv-tabular-viewer',
          displayName: 'TSV (Tabular Viewer)',
          extensions: ['.tsv'],
          mimeTypes: ['text/tab-separated-values'],
          iconClass: 'jp-MaterialIcon jp-SpreadsheetIcon',
          contentType: 'file',
          fileFormat: 'text'
        });
        textFileTypes.push('tsv-tabular-viewer');
        // console.log('[Tabular Data Viewer] TSV file type registered');
      } catch (e) {
        console.warn('[Tabular Data Viewer] TSV file type already registered', e);
      }
    }

    // Create binary factory for Parquet and Excel files
    if (binaryFileTypes.length > 0) {
      const binaryFactory = new TabularDataWidgetFactory(
        {
          name: 'Tabular Data Viewer (Binary)',
          modelName: 'base64',
          fileTypes: binaryFileTypes,
          defaultFor: binaryFileTypes,
          defaultRendered: binaryFileTypes,
          readOnly: true
        },
        (row: any) => {
          lastContextMenuRow = row;
        },
        (widget: TabularDataViewer) => {
          activeWidget = widget;
        },
        () => settings
      );

      docRegistry.addWidgetFactory(binaryFactory);
      // console.log(`[Tabular Data Viewer] Binary factory registered for: ${binaryFileTypes.join(', ')}`);
    }

    // Create text factory for CSV and TSV files
    if (textFileTypes.length > 0) {
      const textFactory = new TabularDataWidgetFactory(
        {
          name: 'Tabular Data Viewer (Text)',
          modelName: 'text',
          fileTypes: textFileTypes,
          defaultFor: textFileTypes,
          defaultRendered: textFileTypes,
          readOnly: true
        },
        (row: any) => {
          lastContextMenuRow = row;
        },
        (widget: TabularDataViewer) => {
          activeWidget = widget;
        },
        () => settings
      );

      docRegistry.addWidgetFactory(textFactory);
      // console.log(`[Tabular Data Viewer] Text factory registered for: ${textFileTypes.join(', ')}`);
    }

    if (binaryFileTypes.length === 0 && textFileTypes.length === 0) {
      console.warn('[Tabular Data Viewer] No file types enabled in settings');
    }
  }
};

export default plugin;
