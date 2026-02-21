import { describe, it, expect } from 'vitest'
import {
	PREFECTURES,
	PREFECTURE_MAP,
	PREFECTURE_NAME_TO_CODE,
	type Prefecture,
} from './prefectures'

describe('prefectures', () => {
	describe('PREFECTURES', () => {
		it('should have 47 prefectures', () => {
			expect(PREFECTURES).toHaveLength(47)
		})

		it('should have valid prefecture codes', () => {
			PREFECTURES.forEach((prefecture) => {
				expect(prefecture.code).toMatch(/^\d{2}$/)
			})
		})

		it('should have unique codes', () => {
			const codes = PREFECTURES.map((p) => p.code)
			const uniqueCodes = new Set(codes)
			expect(uniqueCodes.size).toBe(codes.length)
		})
	})

	describe('PREFECTURE_MAP', () => {
		it('should be able to get prefecture by code', () => {
			const hokkaido = PREFECTURE_MAP.get('01')
			expect(hokkaido).toBeDefined()
			expect(hokkaido?.name).toBe('北海道')
		})

		it('should have 47 entries', () => {
			expect(PREFECTURE_MAP.size).toBe(47)
		})
	})

	describe('PREFECTURE_NAME_TO_CODE', () => {
		it('should be able to get code by prefecture name', () => {
			const code = PREFECTURE_NAME_TO_CODE.get('東京都')
			expect(code).toBe('13')
		})

		it('should have 47 entries', () => {
			expect(PREFECTURE_NAME_TO_CODE.size).toBe(47)
		})
	})

	describe('Prefecture type', () => {
		it('should have required properties', () => {
			const tokyo: Prefecture = {
				code: '13',
				name: '東京都',
				nameEn: 'Tokyo',
				capital: '東京',
				lat: 35.6895,
				lng: 139.6917,
			}
			expect(tokyo.code).toBe('13')
			expect(tokyo.name).toBe('東京都')
		})
	})
})
