import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
  IDocumentWidget,
  DocumentRegistry,
  ABCWidgetFactory
} from '@jupyterlab/docregistry';

import { ParquetViewer } from './widget';
import { ParquetDocument } from './document';

/**
 * A widget factory for Parquet files
 */
class ParquetWidgetFactory extends ABCWidgetFactory<
  IDocumentWidget<ParquetViewer>
> {
  private _setLastContextMenuRow: (row: any) => void;

  constructor(
    options: DocumentRegistry.IWidgetFactoryOptions,
    setLastContextMenuRow: (row: any) => void
  ) {
    super(options);
    this._setLastContextMenuRow = setLastContextMenuRow;
  }

  /**
   * Create a new widget given a context
   */
  protected createNewWidget(
    context: DocumentRegistry.Context
  ): IDocumentWidget<ParquetViewer> {
    const content = new ParquetViewer(context.path, this._setLastContextMenuRow);
    const widget = new ParquetDocument({ content, context });
    widget.title.label = context.path.split('/').pop() || 'Parquet File';
    return widget;
  }
}

/**
 * Initialization data for the jupyterlab_parquet_viewer_extension extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_parquet_viewer_extension:plugin',
  description:
    'Jupyterlab extension to allow simple browsing of the parquet files with basic data filtering capabilities',
  autoStart: true,
  requires: [],
  activate: (app: JupyterFrontEnd) => {
    console.log(
      'JupyterLab extension jupyterlab_parquet_viewer_extension is activated!'
    );

    const { docRegistry, commands, contextMenu } = app;

    // Track last right-clicked row for context menu
    let lastContextMenuRow: any = null;

    // Command to copy row as JSON
    const copyRowCommand = 'parquet-viewer:copy-row-json';
    commands.addCommand(copyRowCommand, {
      label: 'Copy Row as JSON',
      caption: 'Copy the row data as JSON to clipboard',
      isEnabled: () => {
        return lastContextMenuRow !== null;
      },
      execute: async () => {
        if (lastContextMenuRow) {
          const jsonString = JSON.stringify(lastContextMenuRow, null, 2);
          await navigator.clipboard.writeText(jsonString);
          console.log('Row copied to clipboard as JSON');
        }
      }
    });

    // Add to context menu for parquet viewer rows
    contextMenu.addItem({
      command: copyRowCommand,
      selector: '.jp-ParquetViewer-row',
      rank: 10
    });

    // Register the file type - mark as binary to prevent text loading
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
      console.log('Parquet file type registered with base64 format');
    } catch (e) {
      console.warn('Parquet file type already registered', e);
    }

    // Create widget factory - use base64 model to handle binary files
    const factory = new ParquetWidgetFactory(
      {
        name: 'Parquet Viewer',
        modelName: 'base64',
        fileTypes: ['parquet'],
        defaultFor: ['parquet'],
        defaultRendered: ['parquet'],
        readOnly: true
      },
      (row: any) => {
        lastContextMenuRow = row;
      }
    );

    // Register the factory
    docRegistry.addWidgetFactory(factory);

    console.log('Parquet viewer factory registered with base64 model');
  }
};

export default plugin;
