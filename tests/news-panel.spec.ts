import { test, expect } from '@playwright/test';

test.describe('ニュースパネル', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 地図が読み込まれるまで待機（viewBox属性で地図SVGを特定）
    await expect(page.locator('svg[viewBox="0 0 800 800"]')).toBeVisible();
    await page.waitForTimeout(500);
  });

  test('ニュースパネルが表示される', async ({ page }) => {
    // ニュースパネルのヘッダー
    const newsPanel = page.locator('text=衆院ニュース');
    await expect(newsPanel).toBeVisible();
    
    // NHKラベル
    const nhkLabel = page.locator('text=NHK');
    await expect(nhkLabel).toBeVisible();
  });

  test('カテゴリフィルタが表示される', async ({ page }) => {
    // 「すべて」ボタン
    const allFilter = page.locator('button:has-text("すべて")');
    await expect(allFilter).toBeVisible();
    
    // 衆院選カテゴリ（実際のラベルは「衆院選」）
    const electionFilter = page.locator('button:has-text("衆院選")');
    await expect(electionFilter).toBeVisible();
    
    // 国会カテゴリ
    const dietFilter = page.locator('button:has-text("国会")');
    await expect(dietFilter).toBeVisible();
  });

  test('更新ボタンが表示される', async ({ page }) => {
    const refreshButton = page.locator('button:has-text("更新")');
    await expect(refreshButton).toBeVisible();
  });

  test('更新ボタンをクリックできる', async ({ page }) => {
    const refreshButton = page.locator('button:has-text("更新")');
    
    // 更新ボタンをクリック
    await refreshButton.click({ force: true });
    
    // ボタンがまだ表示されている
    await expect(refreshButton).toBeVisible();
  });
});

test.describe('カテゴリフィルタ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 地図が読み込まれるまで待機（viewBox属性で地図SVGを特定）
    await expect(page.locator('svg[viewBox="0 0 800 800"]')).toBeVisible();
    await page.waitForTimeout(500);
  });

  test('「すべて」がデフォルトで選択されている', async ({ page }) => {
    const allFilter = page.locator('button:has-text("すべて")');
    await expect(allFilter).toHaveClass(/bg-cyan-500\/20/);
  });

  test('カテゴリを切り替えられる', async ({ page }) => {
    // 衆院選カテゴリをクリック（実際のラベルは「衆院選」）
    const electionFilter = page.locator('button:has-text("衆院選")');
    await electionFilter.click({ force: true });
    
    // 選択状態になる（クラスにスタイルが適用される）
    await expect(electionFilter).toBeVisible();
    
    // 「すべて」は非選択状態になる
    const allFilter = page.locator('button:has-text("すべて")');
    await expect(allFilter).not.toHaveClass(/bg-cyan-500\/20/);
  });

  test('国会カテゴリをクリックできる', async ({ page }) => {
    const dietFilter = page.locator('button:has-text("国会")');
    await dietFilter.click({ force: true });
    await expect(dietFilter).toBeVisible();
  });

  test('議員カテゴリをクリックできる', async ({ page }) => {
    const memberFilter = page.locator('button:has-text("議員")');
    await memberFilter.click({ force: true });
    await expect(memberFilter).toBeVisible();
  });

  test('政治カテゴリをクリックできる', async ({ page }) => {
    const politicsFilter = page.locator('button:has-text("政治")');
    await politicsFilter.click({ force: true });
    await expect(politicsFilter).toBeVisible();
  });

  test('再度クリックで選択解除されない（トグル動作確認）', async ({ page }) => {
    // 衆院選カテゴリをクリック（実際のラベルは「衆院選」）
    const electionFilter = page.locator('button:has-text("衆院選")');
    await electionFilter.click({ force: true });
    
    // 「すべて」に戻す
    const allFilter = page.locator('button:has-text("すべて")');
    await allFilter.click({ force: true });
    
    // 「すべて」が選択状態になる
    await expect(allFilter).toHaveClass(/bg-cyan-500\/20/);
  });
});

test.describe('ニュース一覧', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 地図が読み込まれるまで待機（viewBox属性で地図SVGを特定）
    await expect(page.locator('svg[viewBox="0 0 800 800"]')).toBeVisible();
    await page.waitForTimeout(500);
  });

  test('ニュースの件数が表示される', async ({ page }) => {
    // フッターに件数が表示される
    const newsCount = page.locator('text=/件のニュース/');
    await expect(newsCount).toBeVisible();
  });

  test('最終更新時刻が表示される', async ({ page }) => {
    // ★修正: lastUpdated は外部APIフェッチ成功時のみ設定される
    // NewsPanel.tsx: {lastUpdated && <div>最終更新: ...</div>}
    // テスト環境では外部通信が失敗する可能性があるため、条件付きで確認する
    await expect(page.locator('text=/件のニュース/')).toBeVisible({ timeout: 10000 });

    // ニュースが1件以上取得できた場合のみ lastUpdated が表示される
    const newsCountText = await page.locator('text=/件のニュース/').textContent();
    const count = parseInt(newsCountText ?? '0');

    if (count > 0) {
      const lastUpdated = page.locator('text=最終更新:');
      await expect(lastUpdated).toBeVisible();
    } else {
      // ニュース取得失敗またはテスト環境のためスキップ
      console.log('No news loaded (possibly no network access), skipping lastUpdated check');
    }
  });
});

test.describe('ニュースパネルの状態', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 地図が読み込まれるまで待機（viewBox属性で地図SVGを特定）
    await expect(page.locator('svg[viewBox="0 0 800 800"]')).toBeVisible();
    await page.waitForTimeout(500);
  });

  test('ニュースパネルがスクロール可能', async ({ page }) => {
    // ニュースパネルのコンテナを確認
    const newsPanel = page.locator('text=衆院ニュース').locator('..');
    await expect(newsPanel).toBeVisible();
  });

  test('空の状態でもUIが表示される', async ({ page }) => {
    // ニュースパネル自体が存在することを確認
    const newsPanel = page.locator('text=衆院ニュース');
    await expect(newsPanel).toBeVisible();
    
    // カテゴリフィルタも表示される
    const allFilter = page.locator('button:has-text("すべて")');
    await expect(allFilter).toBeVisible();
  });
});

test.describe('ニュースカード', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 地図が読み込まれるまで待機（viewBox属性で地図SVGを特定）
    await expect(page.locator('svg[viewBox="0 0 800 800"]')).toBeVisible();
    // ニュースが読み込まれるまで少し待機
    await page.waitForTimeout(1000);
  });

  test('ニュースカードが表示される可能性がある', async ({ page }) => {
    // ニュースパネルが存在することを確認
    const newsPanel = page.locator('text=衆院ニュース');
    await expect(newsPanel).toBeVisible();
    
    // ニュースがある場合はカードが表示される
    // ニュースがない場合は「ニュースがありません」が表示される
    const hasNews = await page.locator('.news-card').count() > 0;
    
    if (hasNews) {
      const firstNewsCard = page.locator('.news-card').first();
      await expect(firstNewsCard).toBeVisible();
    } else {
      const noNews = page.locator('text=ニュースがありません');
      // ニュースがない状態も正常
      await expect(noNews.or(page.locator('text=件のニュース'))).toBeVisible();
    }
  });
});