import { describe, it, expect } from 'vitest'
import {
	getNameVariations,
	matchNewsForMember,
	matchNewsForMembers,
	getMemberNamesFromNews,
} from './memberMatcher'
import type { SingleSeatMember, ProportionalMember } from '../types/member'
import type { NewsItem } from '../types/news'

// テスト用のモックデータ
const createSingleSeatMember = (
	name: string,
	kana?: string
): SingleSeatMember => ({
	id: 1,
	prefecture: '北海道',
	prefectureCode: '01',
	district: '1区',
	party: '自民',
	name,
	kana: kana || '',
	age: 43,
	status: '新',
	terms: 1,
	background: '元北海道議会議員',
})

const createProportionalMember = (
	name: string,
	kana?: string
): ProportionalMember => ({
	id: 100,
	block: '北海道ブロック',
	party: '自民',
	name,
	kana: kana || '',
	status: '前',
	age: 50,
	terms: 5,
	background: '元大臣',
})

const createNewsItem = (
	title: string,
	memberNames: string[] = []
): NewsItem => ({
	id: 'test-1',
	title,
	link: 'https://example.com/news/1',
	source: 'nhk',
	publishedAt: '2024-01-01T00:00:00Z',
	category: 'politics',
	memberNames,
})

describe('memberMatcher', () => {
	describe('getNameVariations', () => {
		it('フルネームを含むバリエーションを返す', () => {
			const member = createSingleSeatMember('加藤　貴弘', 'かとう　たかひろ')
			const variations = getNameVariations(member)

			expect(variations).toContain('加藤　貴弘')
			expect(variations).toContain('加藤貴弘') // スペースなし
		})

		it('名字のみを含む', () => {
			const member = createSingleSeatMember('加藤　貴弘', 'かとう　たかひろ')
			const variations = getNameVariations(member)

			expect(variations).toContain('加藤')
		})

		it('かなのバリエーションを含む', () => {
			const member = createSingleSeatMember('加藤　貴弘', 'かとう　たかひろ')
			const variations = getNameVariations(member)

			expect(variations).toContain('かとう　たかひろ')
			expect(variations).toContain('かとうたかひろ') // スペースなし
		})

		it('半角スペースでも正しく動作する', () => {
			const member = createSingleSeatMember('加藤 貴弘', 'かとう たかひろ')
			const variations = getNameVariations(member)

			expect(variations).toContain('加藤 貴弘')
			expect(variations).toContain('加藤貴弘')
		})

		it('かながない場合でも正しく動作する', () => {
			const member = createSingleSeatMember('加藤　貴弘', '')
			const variations = getNameVariations(member)

			expect(variations).toContain('加藤　貴弘')
			expect(variations).toContain('加藤貴弘')
			expect(variations).toContain('加藤')
		})

		it('重複を除外する', () => {
			const member = createSingleSeatMember('山田　山田', 'やまだ　やまだ')
			const variations = getNameVariations(member)

			// 重複がないことを確認
			const uniqueVariations = [...new Set(variations)]
			expect(variations.length).toBe(uniqueVariations.length)
		})

		it('比例代表議員でも正しく動作する', () => {
			const member = createProportionalMember('伊東　良孝', 'いとう　よしたか')
			const variations = getNameVariations(member)

			expect(variations).toContain('伊東　良孝')
			expect(variations).toContain('伊東良孝')
			expect(variations).toContain('伊東')
		})
	})

	describe('matchNewsForMember', () => {
		it('タイトルに名前が含まれるニュースをマッチする', () => {
			const member = createSingleSeatMember('加藤　貴弘')
			const news = [
				createNewsItem('加藤貴弘氏が会見'),
				createNewsItem('山田太郎氏が出演'),
			]

			const matched = matchNewsForMember(news, member)

			expect(matched).toHaveLength(1)
			expect(matched[0].title).toBe('加藤貴弘氏が会見')
		})

		it('memberNamesに名前が含まれるニュースをマッチする', () => {
			const member = createSingleSeatMember('加藤　貴弘')
			const news = [
				createNewsItem('政治ニュース', ['加藤貴弘', '山田太郎']),
				createNewsItem('経済ニュース', ['鈴木一郎']),
			]

			const matched = matchNewsForMember(news, member)

			expect(matched).toHaveLength(1)
			expect(matched[0].title).toBe('政治ニュース')
		})

		it('複数のニュースにマッチする', () => {
			const member = createSingleSeatMember('加藤　貴弘')
			const news = [
				createNewsItem('加藤氏が会見'),
				createNewsItem('加藤貴弘氏が演説'),
				createNewsItem('山田氏が出演'),
			]

			const matched = matchNewsForMember(news, member)

			expect(matched).toHaveLength(2)
		})

		it('名字でもマッチする', () => {
			const member = createSingleSeatMember('加藤　貴弘')
			const news = [createNewsItem('加藤氏の動向')]

			const matched = matchNewsForMember(news, member)

			expect(matched).toHaveLength(1)
		})

		it('マッチするニュースがない場合は空配列を返す', () => {
			const member = createSingleSeatMember('加藤　貴弘')
			const news = [
				createNewsItem('山田氏が会見'),
				createNewsItem('鈴木氏が演説'),
			]

			const matched = matchNewsForMember(news, member)

			expect(matched).toHaveLength(0)
		})

		it('ニュースのmemberNamesに名字が含まれる場合もマッチする', () => {
			const member = createSingleSeatMember('加藤　貴弘')
			const news = [createNewsItem('政治ニュース', ['加藤'])]

			const matched = matchNewsForMember(news, member)

			expect(matched).toHaveLength(1)
		})
	})

	describe('matchNewsForMembers', () => {
		it('複数の議員にニュースをマッチする', () => {
			const members = [
				createSingleSeatMember('加藤　貴弘'),
				createSingleSeatMember('山田　太郎'),
			]
			const news = [
				createNewsItem('加藤氏が会見'),
				createNewsItem('山田氏が演説'),
				createNewsItem('鈴木氏が出演'),
			]

			const result = matchNewsForMembers(news, members)

			expect(result.size).toBe(2)
			expect(result.get('加藤　貴弘')).toHaveLength(1)
			expect(result.get('山田　太郎')).toHaveLength(1)
		})

		it('マッチするニュースがない議員は結果に含まれない', () => {
			const members = [
				createSingleSeatMember('加藤　貴弘'),
				createSingleSeatMember('山田　太郎'),
			]
			const news = [createNewsItem('加藤氏が会見')]

			const result = matchNewsForMembers(news, members)

			expect(result.size).toBe(1)
			expect(result.has('加藤　貴弘')).toBe(true)
			expect(result.has('山田　太郎')).toBe(false)
		})

		it('同じニュースが複数の議員にマッチする場合がある', () => {
			const members = [
				createSingleSeatMember('加藤　貴弘'),
				createSingleSeatMember('加藤　次郎'), // 同じ名字
			]
			const news = [createNewsItem('加藤氏が会見')]

			const result = matchNewsForMembers(news, members)

			expect(result.size).toBe(2)
		})

		it('比例代表議員も含めてマッチする', () => {
			const members = [
				createSingleSeatMember('加藤　貴弘'),
				createProportionalMember('伊東　良孝'),
			]
			const news = [
				createNewsItem('加藤氏が会見'),
				createNewsItem('伊東氏が演説'),
			]

			const result = matchNewsForMembers(news, members)

			expect(result.size).toBe(2)
		})
	})

	describe('getMemberNamesFromNews', () => {
		it('ニュースから議員名を抽出する', () => {
			const news = [
				createNewsItem('ニュース1', ['加藤貴弘', '山田太郎']),
				createNewsItem('ニュース2', ['鈴木一郎']),
			]

			const names = getMemberNamesFromNews(news)

			expect(names).toContain('加藤貴弘')
			expect(names).toContain('山田太郎')
			expect(names).toContain('鈴木一郎')
			expect(names).toHaveLength(3)
		})

		it('重複する名前は除外する', () => {
			const news = [
				createNewsItem('ニュース1', ['加藤貴弘', '山田太郎']),
				createNewsItem('ニュース2', ['加藤貴弘', '鈴木一郎']),
			]

			const names = getMemberNamesFromNews(news)

			expect(names).toHaveLength(3)
		})

		it('memberNamesが空の場合は空配列を返す', () => {
			const news = [createNewsItem('ニュース1', [])]

			const names = getMemberNamesFromNews(news)

			expect(names).toHaveLength(0)
		})

		it('空のニュース配列の場合は空配列を返す', () => {
			const names = getMemberNamesFromNews([])

			expect(names).toHaveLength(0)
		})
	})
})