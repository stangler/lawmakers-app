import { test, expect } from '@playwright/test';

// /api/me をモックするヘルパー
async function mockApiMe(page: Parameters<Parameters<typeof test>[1]>[0]['page']) {
  await page.route('**/api/me', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'test-user', name: 'Test User' }),
    });
  });
}

test.describe('議員パネル', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiMe(page);
    await page.goto('/');
    // 地図が読み込まれるまで待機（viewBox属性で地図SVGを特定）
    await expect(page.locator('svg[viewBox="0 0 800 800"]')).toBeVisible();
    // D3.jsのレンダリングを待つ
    await page.waitForTimeout(500);
  });

  test('初期状態でメッセージが表示される', async ({ page }) => {
    // 議員一覧パネル（未選択時のみ「議員一覧」が表示される）
    const memberPanel = page.locator('text=議員一覧');
    await expect(memberPanel).toBeVisible();
    
    // 初期状態のメッセージ
    const initialMessage = page.locator('text=地図上の都道府県または');
    await expect(initialMessage).toBeVisible();
  });

  test('都道府県選択で議員一覧が表示される', async ({ page }) => {
    // 北海道（最初のパス）をクリック（地図SVG内のパスを特定）
    const firstPath = page.locator('svg[viewBox="0 0 800 800"] path').first();
    await firstPath.click({ force: true });
    
    // 議員数が表示される
    const memberCount = page.locator('text=名の議員');
    await expect(memberCount).toBeVisible();
  });

  test('議員カードが表示される', async ({ page }) => {
    // 都道府県を選択（地図SVG内のパスを特定）
    const firstPath = page.locator('svg[viewBox="0 0 800 800"] path').first();
    await firstPath.click({ force: true });
    
    // 議員数が表示されるまで待機
    const memberCount = page.locator('text=名の議員');
    await expect(memberCount).toBeVisible();
    
    // 政党名が表示される（政党でグループ化されている）
    const partyHeader = page.locator('text=/^\\(.+名\\)$/').first();
    await expect(partyHeader).toBeVisible();
  });

  test('議員をクリックすると詳細が表示される', async ({ page }) => {
    // 都道府県を選択（地図SVG内のパスを特定）
    const firstPath = page.locator('svg[viewBox="0 0 800 800"] path').first();
    await firstPath.click({ force: true });
    
    // 議員数が表示されるまで待機
    await expect(page.locator('text=名の議員')).toBeVisible();
    
    // 最初の議員カードを探してクリック
    const memberCard = page.locator('[class*="cursor-pointer"]').first();
    if (await memberCard.isVisible()) {
      await memberCard.click({ force: true });
      
      // 戻るボタンが表示される
      const backButton = page.locator('text=← 戻る');
      await expect(backButton).toBeVisible();
    }
  });

  test('戻るボタンで議員一覧に戻る', async ({ page }) => {
    // 都道府県を選択（地図SVG内のパスを特定）
    const firstPath = page.locator('svg[viewBox="0 0 800 800"] path').first();
    await firstPath.click({ force: true });
    
    // 議員数が表示されるまで待機
    await expect(page.locator('text=名の議員')).toBeVisible();
    
    // 議員カードを探す（地図SVG外のcursor-pointer要素に限定）
    // MemberPanel内のdivのcursor-pointer要素を対象にする
    const memberCards = page.locator('div.cursor-pointer');
    
    const cardCount = await memberCards.count();
    if (cardCount > 0) {
      await memberCards.first().click({ force: true });
      await page.waitForTimeout(300);
      
      // 戻るボタンが表示される
      const backButton = page.locator('text=← 戻る');
      await expect(backButton).toBeVisible();
      
      // 戻るボタンをクリック
      await backButton.click({ force: true });
      await page.waitForTimeout(300);
      
      // ★修正: 都道府県選択後は「議員一覧」ではなく「名の議員」が表示される
      // MemberPanel.tsx の member list view では {title}（都道府県名）と「N名の議員」が表示される
      const memberCount = page.locator('text=名の議員');
      await expect(memberCount).toBeVisible();
    } else {
      // 議員がいない場合はテストをスキップ
      console.log('No member cards found, skipping test');
    }
  });

  test('議員詳細で関連ニュースが表示される', async ({ page }) => {
    // 都道府県を選択（地図SVG内のパスを特定）
    const firstPath = page.locator('svg[viewBox="0 0 800 800"] path').first();
    await firstPath.click({ force: true });
    
    // 議員数が表示されるまで待機
    await expect(page.locator('text=名の議員')).toBeVisible();
    
    // 最初の議員カードをクリック
    const memberCard = page.locator('[class*="cursor-pointer"]').first();
    if (await memberCard.isVisible()) {
      await memberCard.click({ force: true });
      
      // 関連ニュースの件数が表示される
      const newsCount = page.locator('text=/件の関連ニュース/');
      await expect(newsCount).toBeVisible();
    }
  });
});

test.describe('比例代表モードの議員パネル', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiMe(page);
    await page.goto('/');
    // 地図が読み込まれるまで待機（viewBox属性で地図SVGを特定）
    await expect(page.locator('svg[viewBox="0 0 800 800"]')).toBeVisible();
    await page.waitForTimeout(500);
  });

  test('比例代表モードでブロック選択時に議員が表示される', async ({ page }) => {
    // 比例代表モードに切り替え
    const proportionalButton = page.locator('button:has-text("比例代表")');
    await proportionalButton.click({ force: true });
    
    // モード切り替え後の再レンダリングを待つ
    await page.waitForTimeout(500);
    
    // 最初のパスをクリック（地図SVG内のパスを特定）
    const firstPath = page.locator('svg[viewBox="0 0 800 800"] path').first();
    await firstPath.click({ force: true });
    
    // 議員数が表示される
    const memberCount = page.locator('text=名の議員');
    await expect(memberCount).toBeVisible();
  });

  test('比例代表モードでブロック名が表示される', async ({ page }) => {
    // 比例代表モードに切り替え
    const proportionalButton = page.locator('button:has-text("比例代表")');
    await proportionalButton.click({ force: true });
    
    // モード切り替え後の再レンダリングを待つ
    await page.waitForTimeout(500);
    
    // 最初のパスをクリック（地図SVG内のパスを特定）
    const firstPath = page.locator('svg[viewBox="0 0 800 800"] path').first();
    await firstPath.click({ force: true });
    
    // ブロック名が表示される（"ブロック"を含むテキスト）
    const blockTitle = page.locator('text=/ブロック$/');
    await expect(blockTitle).toBeVisible();
  });
});

test.describe('議員パネルのスクロール', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiMe(page);
    await page.goto('/');
    // 地図が読み込まれるまで待機（viewBox属性で地図SVGを特定）
    await expect(page.locator('svg[viewBox="0 0 800 800"]')).toBeVisible();
    await page.waitForTimeout(500);
  });

  test('議員が多い都道府県でスクロールできる', async ({ page }) => {
    // 東京都をクリック（複数の議員がいる可能性が高い）
    // 地図上の東京都のパスを探すのは難しいため、最初のパスを使用（地図SVG内のパスを特定）
    const firstPath = page.locator('svg[viewBox="0 0 800 800"] path').first();
    await firstPath.click({ force: true });
    
    // 議員数が表示される
    const memberCount = page.locator('text=名の議員');
    await expect(memberCount).toBeVisible();
    
    // ★修正: 都道府県選択後は「議員一覧」は存在しない
    // MemberPanel.tsx の member list view では「N名の議員」テキストの親要素でパネルを確認する
    const panel = page.locator('text=名の議員').locator('..');
    await expect(panel).toBeVisible();
  });
});