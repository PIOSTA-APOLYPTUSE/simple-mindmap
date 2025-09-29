# 🚀 웹 배포 가이드

## 📋 배포 전 체크리스트

### ✅ 파일 확인
- [x] index.html (메인 페이지)
- [x] styles.css (스타일시트)
- [x] mindmap.js (핵심 로직)
- [x] README.md (프로젝트 설명)
- [x] test.spec.js (테스트 파일)
- [x] test-runner.html (테스트 환경)

### 🌐 추천 배포 플랫폼 순서

#### 1. GitHub Pages (무료, 가장 간단)
```
1. GitHub 계정 생성
2. 새 레포지토리 생성 (Public)
3. 파일 업로드
4. Settings → Pages → Deploy from branch
5. 배포 완료: https://[username].github.io/[repo-name]
```

#### 2. Netlify (무료 + 고급 기능)
```
1. netlify.com 가입
2. "New site from Git" 또는 드래그&드롭
3. 자동 배포 완료
4. 커스텀 도메인 설정 가능
```

#### 3. Vercel (무료 + 빠른 성능)
```
1. vercel.com 가입
2. Import Git Repository
3. 자동 빌드 및 배포
4. 고성능 CDN 제공
```

## 🔧 배포 최적화 팁

### SEO 최적화
- ✅ meta description 추가됨
- ✅ meta keywords 추가됨
- ✅ 적절한 title 설정됨
- ✅ 한국어 lang 속성 설정됨

### 성능 최적화
- ✅ CSS/JS 파일 분리됨
- ✅ 외부 의존성 없음 (순수 Vanilla JS)
- ✅ 압축된 CSS 사용
- ✅ 효율적인 DOM 조작

### 접근성
- ✅ 시맨틱 HTML 구조
- ✅ 키보드 단축키 지원
- ✅ 명확한 버튼 title 속성
- ✅ 색상 대비 최적화 (나이트모드)

## 📱 테스트 체크리스트

배포 전 로컬에서 확인:
- [ ] 노드 생성 (원형, 사각형)
- [ ] 노드 연결 (실선, 점선)
- [ ] 텍스트 편집 (더블클릭)
- [ ] 다중 선택 (Ctrl+클릭, 드래그)
- [ ] 삭제 기능 (우클릭, Delete키, 삭제모드)
- [ ] 키보드 단축키 (Ctrl+C, Ctrl+R, Escape)
- [ ] 모바일 반응형 확인

## 🌍 배포 후 확인사항

- [ ] 페이지 로딩 정상
- [ ] 모든 기능 동작 확인
- [ ] 다양한 브라우저 테스트
- [ ] 모바일 기기 테스트
- [ ] 콘솔 에러 없음

## 🎯 완료!

배포가 완료되면 URL을 공유하여 사용자들이 접근할 수 있습니다.

**예시 URL:**
- GitHub Pages: `https://[username].github.io/mindmap-app`
- Netlify: `https://[app-name].netlify.app`
- Vercel: `https://[app-name].vercel.app`