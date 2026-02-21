import { describe, it, expect } from 'vitest'
import { getMemberImageUrl } from './memberImage'

describe('memberImage', () => {
	describe('getMemberImageUrl', () => {
		describe('有効なID（画像が存在する場合）', () => {
			it('ID: 1 の場合、正しい画像パスを返す', () => {
				const result = getMemberImageUrl(1)
				expect(result).toBe('/data/1_katou-takahiro.jpg')
			})

			it('ID: 2 の場合、正しい画像パスを返す', () => {
				const result = getMemberImageUrl(2)
				expect(result).toBe('/data/2_takahashi-yuusuke.jpg')
			})

			it('ID: 3 の場合、正しい画像パスを返す', () => {
				const result = getMemberImageUrl(3)
				expect(result).toBe('/data/3_takagi-hirohisa.jpg')
			})

			it('ID: 4 の場合、正しい画像パスを返す', () => {
				const result = getMemberImageUrl(4)
				expect(result).toBe('/data/4_nakamura-hiroyuki.jpg')
			})

			it('ID: 5 の場合、正しい画像パスを返す', () => {
				const result = getMemberImageUrl(5)
				expect(result).toBe('/data/5_wada-yoshiaki.jpg')
			})

			it('ID: 6 の場合、正しい画像パスを返す', () => {
				const result = getMemberImageUrl(6)
				expect(result).toBe('/data/6_azuma-kuniyoshi.jpg')
			})

			it('ID: 7 の場合、正しい画像パスを返す', () => {
				const result = getMemberImageUrl(7)
				expect(result).toBe('/data/7_suzuki_takako.jpg')
			})

			it('ID: 8 の場合、正しい画像パスを返す', () => {
				const result = getMemberImageUrl(8)
				expect(result).toBe('/data/8_mukouyama-jyun.jpg')
			})

			it('ID: 9 の場合、正しい画像パスを返す', () => {
				const result = getMemberImageUrl(9)
				expect(result).toBe('/data/9_matsushita-hideki.jpg')
			})

			it('ID: 10 の場合、正しい画像パスを返す', () => {
				const result = getMemberImageUrl(10)
				expect(result).toBe('/data/10_kamiya-hiroshi.jpg')
			})

			it('ID: 11 の場合、正しい画像パスを返す', () => {
				const result = getMemberImageUrl(11)
				expect(result).toBe('/data/11_nakagawa-koichi.jpg')
			})

			it('ID: 12 の場合、正しい画像パスを返す', () => {
				const result = getMemberImageUrl(12)
				expect(result).toBe('/data/12_takebe-arata.jpg')
			})
		})

		describe('無効なID（画像が存在しない場合）', () => {
			it('ID: 0 の場合、nullを返す', () => {
				const result = getMemberImageUrl(0)
				expect(result).toBeNull()
			})

			it('ID: 13 の場合、nullを返す', () => {
				const result = getMemberImageUrl(13)
				expect(result).toBeNull()
			})

			it('ID: 100 の場合、nullを返す', () => {
				const result = getMemberImageUrl(100)
				expect(result).toBeNull()
			})

			it('負のIDの場合、nullを返す', () => {
				const result = getMemberImageUrl(-1)
				expect(result).toBeNull()
			})
		})

		describe('パス形式の確認', () => {
			it('返されるパスが /data/ で始まる', () => {
				const result = getMemberImageUrl(1)
				expect(result).toMatch(/^\/data\//)
			})

			it('返されるパスが .jpg で終わる', () => {
				const result = getMemberImageUrl(1)
				expect(result).toMatch(/\.jpg$/)
			})
		})
	})
})