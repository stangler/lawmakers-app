import { test, expect } from '@playwright/test';

test.describe('アプリ初期表示', () => {
  test('ページが正常に読み込まれる', async ({ page }) => {
    await page.goto('/');
    
    // タイトルが正しく表示される
    await expect(page).toHaveTitle(/lawmakers-app/);
  });

  test('ヘッダーが表示される', async ({ page }) => {
    await page.goto('/');
    
    // ヘッダーのタイトル
    const headerTitle = page.locator('h1:has-text("衆議院議員マップ")');
    await expect(headerTitle).toBeVisible();
    
    // モード切替ボタン
    const singleSeatButton = page.locator('button:has-text("小選挙区")');
    const proportionalButton = page.locator('button:has-text("比例代表")');
    
    await expect(singleSeatButton).toBeVisible();
    await expect(proportionalButton).toBeVisible();
  });

  test('地図が表示される', async ({ page }) => {
    await page.goto('/');
    
    // SVG地図が表示されるまで待機（viewBox属性で地図SVGを特定）
    const svgMap = page.locator('svg[viewBox="0 0 800 800"]');
    await expect(svgMap).toBeVisible();
    
    // 都道府県のパスが存在する
    const prefecturePaths = page.locator('svg[viewBox="0 0 800 800"] path');
    await expect(prefecturePaths.first()).toBeVisible();
  });

  test('議員パネルが表示される', async ({ page }) => {
    await page.goto('/');
    
    // 議員一覧パネル
    const memberPanel = page.locator('text=議員一覧');
    await expect(memberPanel).toBeVisible();
    
    // 初期状態のメッセージ
    const initialMessage = page.locator('text=地図上の都道府県または');
    await expect(initialMessage).toBeVisible();
  });

  test('ニュースパネルが表示される', async ({ page }) => {
    await page.goto('/');
    
    // ニュースパネルのヘッダー
    const newsPanel = page.locator('text=衆院ニュース');
    await expect(newsPanel).toBeVisible();
    
    // カテゴリフィルタボタン
    const allFilter = page.locator('button:has-text("すべて")');
    await expect(allFilter).toBeVisible();
  });
});

test.describe('モード切り替え', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('svg[viewBox="0 0 800 800"]')).toBeVisible();
    await page.waitForTimeout(500);
  });

  test('小選挙区モードがデフォルトで選択されている', async ({ page }) => {
    const singleSeatButton = page.locator('button:has-text("小選挙区")');
    await expect(singleSeatButton).toHaveClass(/bg-cyan-500\/20/);
  });

  test('比例代表モードに切り替えられる', async ({ page }) => {
    // 比例代表ボタンをクリック
    const proportionalButton = page.locator('button:has-text("比例代表")');
    await proportionalButton.click({ force: true });
    
    // ボタンが選択状態になる
    await expect(proportionalButton).toHaveClass(/bg-cyan-500\/20/);
    
    // 小選挙区ボタンが非選択状態になる
    const singleSeatButton = page.locator('button:has-text("小選挙区")');
    await expect(singleSeatButton).not.toHaveClass(/bg-cyan-500\/20/);
  });

  test('モード切り替えで選択がリセットされる', async ({ page }) => {
    // 北海道をクリック（小選挙区モード）- 地図SVG内のパスを特定
    const hokkaidoPath = page.locator('svg[viewBox="0 0 800 800"] path').first();
    await hokkaidoPath.click({ force: true });
    
    // 議員パネルに議員が表示される
    const memberPanel = page.locator('text=名の議員');
    await expect(memberPanel).toBeVisible();
    
    // 比例代表に切り替え
    const proportionalButton = page.locator('button:has-text("比例代表")');
    await proportionalButton.click({ force: true });
    
    // 選択がリセットされる
    const initialMessage = page.locator('text=地図上の都道府県または');
    await expect(initialMessage).toBeVisible();
  });
});

test.describe('ローディング状態', () => {
  test('データ読み込み後に地図が表示される', async ({ page }) => {
    // ネットワーク遅延をシミュレート
    await page.goto('/');
    
    // ローディングが完了して地図が表示される（viewBox属性で地図SVGを特定）
    const svgMap = page.locator('svg[viewBox="0 0 800 800"]');
    await expect(svgMap).toBeVisible({ timeout: 10000 });
  });
});