document.addEventListener('DOMContentLoaded', () => {
    // true로 설정하면 목업 데이터 사용, false로 설정하면 실제 API 호출
    const useMockData = true;

    // 무한 스크롤 상태 관리
    let isLoading = false;
    let currentPage = 1;
    const promotionsPerPage = 12; 
    let allApiPromotions = [];
    let isEndOfData = false;

    // 디바이스(PC/모바일)를 감지하는 함수
    function isMobile() {
        return window.innerWidth < 768;
    }

    // 목업 데이터 생성 함수
    function generateMockData(count) {
        const data = [];
        const sampleTitles = ["해외여행 필수 준비물 데이터 로밍 하셨나요?", "아르누보의 거장 알폰스 무하 전 40%", "아시아나항공 특가 모음집", "산리오 캐릭터 총출동! 도쿄&큐슈 헬로키티 랜드", "도쿄 핫플레이스 특가 찬스! 스카이트리 10% 할인", "후쿠오카 프리미엄 열차여행 선착순 50% 할인", "카리브해 지상 천국 스칼렛 아르떼 리조트 회원 특가", "누구나 최대 3만원 할인 숙박세일 페스타", "여행 날이 남아도! 일본 항공권만 예약할 사람!"];
        for (let i = 1; i <= count; i++) {
            const createDate = new Date(2025, 2, 28 - Math.floor(Math.random() * 10));
            
            data.push({
                title: `${sampleTitles[i % sampleTitles.length]}`,
                imageUrl: `https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=400&h=200&fit=crop&q=80&seed=${i}`,
                linkUrl: "#",
                createDate: createDate.toISOString().split('T')[0],
                orderSeq: Math.floor(i / 10) + 1
            });
        }
        return data;
    }

    // 초기 데이터 로드 함수
    async function loadInitialData() {
        const initialLoader = document.getElementById('initial-loader');
        const promotionListContainer = document.getElementById('promotion-list');
        const errorMessageContainer = document.getElementById('error-message');

        initialLoader.classList.remove('hidden');
        promotionListContainer.classList.add('hidden');
        errorMessageContainer.classList.add('hidden');

        try {
            let promotions = [];
            if (useMockData) {
                console.log("목업 데이터를 사용합니다.");
                promotions = generateMockData(100);
            } else {
                console.log("실제 API를 호출합니다.");
                const uniqCode = isMobile() ? 'TV_IV_C_TOPBANNER' : 'TV_IV_C_P_TOPBANNER';
                const response = await fetch('https://dapi.tourvis.com/api/inventory/getInventoryList', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ uniqCode: uniqCode })
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                promotions = data.data.list || [];
            }

            allApiPromotions = promotions.sort((a, b) => {
                if (a.orderSeq !== b.orderSeq) {
                    return a.orderSeq - b.orderSeq;
                }
                return new Date(b.createDate) - new Date(a.createDate);
            });

            const firstPagePromotions = getPromotionsPage(1);
            renderPromotions(firstPagePromotions, false);
            currentPage = 2;

        } catch (error) {
            console.error('프로모션 데이터를 가져오는 데 실패했습니다:', error);
            errorMessageContainer.textContent = '프로모션 정보를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
            errorMessageContainer.classList.remove('hidden');
        } finally {
            initialLoader.classList.add('hidden');
            promotionListContainer.classList.remove('hidden');
        }
    }

    // 추가 프로모션 로드 함수
    function loadMorePromotions() {
        if (isLoading || isEndOfData) return;

        isLoading = true;
        document.getElementById('mini-loader-container').classList.remove('hidden');

        setTimeout(() => {
            const newPromotions = getPromotionsPage(currentPage);
            if (newPromotions.length > 0) {
                renderPromotions(newPromotions, true);
                currentPage++;
            } else {
                isEndOfData = true;
            }
            
            document.getElementById('mini-loader-container').classList.add('hidden');
            isLoading = false;
        }, 500);
    }
    
    function getPromotionsPage(page) {
        const startIndex = (page - 1) * promotionsPerPage;
        const endIndex = startIndex + promotionsPerPage;
        return allApiPromotions.slice(startIndex, endIndex);
    }

    // 프로모션 렌더링 함수
    function renderPromotions(promotions, append = false) {
        const promotionListContainer = document.getElementById('promotion-list');
        
        if (!append) {
            promotionListContainer.innerHTML = '';
        }

        if (!promotions || promotions.length === 0) {
            if (!append) {
                promotionListContainer.innerHTML = `<p class="col-span-full text-center text-gray-500 py-10">진행중인 프로모션이 없습니다.</p>`;
            }
            return;
        }

        promotions.forEach(promo => {
            const card = `
                <div class="bg-white overflow-hidden">
                    <a href="${promo.linkUrl}" target="_blank" rel="noopener noreferrer" class="group">
                        <div class="overflow-hidden rounded-lg">
                            <img src="${promo.imageUrl}" alt="${promo.title}" class="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" onerror="this.onerror=null;this.src='https://placehold.co/400x200/e2e8f0/adb5bd?text=Image+Not+Found';">
                        </div>
                        <div class="pt-4">
                            <h2 class="text-base font-bold text-gray-800 truncate">${promo.title}</h2>
                            <p class="text-sm text-gray-500 mt-1">${promo.createDate.replaceAll('-', '.')} ~</p>
                        </div>
                    </a>
                </div>
            `;
            promotionListContainer.insertAdjacentHTML('beforeend', card);
        });
    }

    // 초기 데이터 로드 실행
    loadInitialData();

    // 스크롤 이벤트 리스너 추가
    window.addEventListener('scroll', () => {
        if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 100) {
            loadMorePromotions();
        }
    });
});
