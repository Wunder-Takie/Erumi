/**
 * 새 리포트 테스트 페이지
 */

import { useState } from 'react';
import { NewNameReport } from '../components/NewNameReport';

export default function ReportTest() {
    const [showReport, setShowReport] = useState(true);

    // 테스트용 샘플 데이터
    const sampleName = {
        hangulName: '김시랑',
        hanjaName: '金詩朗',
        surname: '김',
        surnameHanja: '金',
        hanja1: { hanja: '詩', hangul: '시' },
        hanja2: { hanja: '朗', hangul: '랑' },
    };

    const sampleSaju = {
        birthDate: '2024-01-15',
        birthHour: 5,
        elements: {
            Wood: 2,
            Fire: 1,
            Earth: 1,
            Metal: 3,
            Water: 1,
        },
        yongsin: ['Fire', 'Wood'],
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <h1 className="text-2xl font-bold mb-4">새 리포트 엔진 테스트</h1>

            <div className="bg-white rounded-lg p-4 mb-4">
                <h2 className="font-semibold mb-2">테스트 이름: {sampleName.hangulName} ({sampleName.hanjaName})</h2>
                <button
                    onClick={() => setShowReport(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                    리포트 보기
                </button>
            </div>

            {showReport && (
                <NewNameReport
                    name={sampleName}
                    saju={sampleSaju}
                    onClose={() => setShowReport(false)}
                />
            )}
        </div>
    );
}
