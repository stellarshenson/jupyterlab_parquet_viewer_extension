import { expect, galata, test } from '@jupyterlab/galata';
import * as path from 'path';

test.describe('Tabular Data Viewer Extension', () => {
  // Upload test data files before running tests
  test.beforeAll(async ({ request, tmpPath }) => {
    const contents = galata.newContentsHelper(request);

    // Path to test data files (relative to project root)
    const dataDir = path.resolve(__dirname, '..', '..', 'data');

    // Upload each test file
    const testFiles = ['sample_data.parquet', 'sample_data.csv', 'sample_data.xlsx'];
    for (const filename of testFiles) {
      const filePath = path.join(dataDir, filename);
      await contents.uploadFile(
        filePath,
        filename,
        tmpPath
      );
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.goto();
  });

  test('should emit an activation console message', async ({ page }) => {
    const logs: string[] = [];

    page.on('console', message => {
      logs.push(message.text());
    });

    await page.goto();

    expect(
      logs.filter(s => s === 'JupyterLab extension jupyterlab_tabular_data_viewer_extension is activated!')
    ).toHaveLength(1);
  });

  test('should open and display Parquet file', async ({ page }) => {
    // Wait for File Browser to be available and click it
    await page.waitForSelector('[title="File Browser"]', { timeout: 30000 });
    await page.click('[title="File Browser"]');

    // Wait for file to be visible
    await page.waitForSelector('text=sample_data.parquet', { timeout: 10000 });

    // Open the Parquet file
    await page.dblclick('text=sample_data.parquet');

    // Wait for the viewer to load
    await page.waitForSelector('.jp-TabularDataViewer', { timeout: 10000 });

    // Verify the table container is present
    const tableContainer = await page.locator('.jp-TabularDataViewer-container');
    await expect(tableContainer).toBeVisible();

    // Verify table headers are present
    const headerRow = await page.locator('.jp-TabularDataViewer-headerRow');
    await expect(headerRow).toBeVisible();

    // Verify we have data rows
    const dataRows = await page.locator('.jp-TabularDataViewer-row');
    const rowCount = await dataRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should open and display CSV file', async ({ page }) => {
    // Wait for File Browser to be available and click it
    await page.waitForSelector('[title="File Browser"]', { timeout: 30000 });
    await page.click('[title="File Browser"]');

    // Wait for file to be visible
    await page.waitForSelector('text=sample_data.csv', { timeout: 10000 });

    // Open the CSV file
    await page.dblclick('text=sample_data.csv');

    // Wait for the viewer to load
    await page.waitForSelector('.jp-TabularDataViewer', { timeout: 10000 });

    // Verify the table container is present
    const tableContainer = await page.locator('.jp-TabularDataViewer-container');
    await expect(tableContainer).toBeVisible();

    // Verify table headers are present
    const headerRow = await page.locator('.jp-TabularDataViewer-headerRow');
    await expect(headerRow).toBeVisible();

    // Verify we have data rows
    const dataRows = await page.locator('.jp-TabularDataViewer-row');
    const rowCount = await dataRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should open and display Excel file', async ({ page }) => {
    // Wait for File Browser to be available and click it
    await page.waitForSelector('[title="File Browser"]', { timeout: 30000 });
    await page.click('[title="File Browser"]');

    // Wait for file to be visible
    await page.waitForSelector('text=sample_data.xlsx', { timeout: 10000 });

    // Open the Excel file
    await page.dblclick('text=sample_data.xlsx');

    // Wait for the viewer to load
    await page.waitForSelector('.jp-TabularDataViewer', { timeout: 10000 });

    // Verify the table container is present
    const tableContainer = await page.locator('.jp-TabularDataViewer-container');
    await expect(tableContainer).toBeVisible();

    // Verify table headers are present
    const headerRow = await page.locator('.jp-TabularDataViewer-headerRow');
    await expect(headerRow).toBeVisible();

    // Verify we have data rows
    const dataRows = await page.locator('.jp-TabularDataViewer-row');
    const rowCount = await dataRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should open all three file types sequentially', async ({ page }) => {
    const fileTypes = ['sample_data.parquet', 'sample_data.csv', 'sample_data.xlsx'];

    for (const fileName of fileTypes) {
      // Wait for File Browser to be available and click it
      await page.waitForSelector('[title="File Browser"]', { timeout: 30000 });
      await page.click('[title="File Browser"]');

      // Wait for file to be visible
      await page.waitForSelector(`text=${fileName}`, { timeout: 10000 });

      // Open the file
      await page.dblclick(`text=${fileName}`);

      // Wait for the viewer to load
      await page.waitForSelector('.jp-TabularDataViewer', { timeout: 10000 });

      // Verify the table container is present
      const tableContainer = await page.locator('.jp-TabularDataViewer-container');
      await expect(tableContainer).toBeVisible();

      // Verify we have data rows
      const dataRows = await page.locator('.jp-TabularDataViewer-row');
      const rowCount = await dataRows.count();
      expect(rowCount).toBeGreaterThan(0);

      // Close the tab to prepare for next file
      await page.keyboard.press('Control+w');
      await page.waitForTimeout(500);
    }
  });
});
