// TDD 테스트 프레임워크 - Night Mode Minimal MindMap
describe('Minimal Night Mode MindMap - TDD', () => {
    let app, canvas, container;

    // 테스트 환경 설정
    beforeEach(() => {
        // DOM 초기화
        document.body.innerHTML = `
            <div id="app" class="night-theme">
                <div class="toolbar">
                    <button id="addCircle" class="tool-btn">○</button>
                    <button id="addRect" class="tool-btn">□</button>
                    <button id="connectMode" class="tool-btn">⟷</button>
                    <button id="lineStyle" class="tool-btn">⸗</button>
                    <button id="clear" class="tool-btn">×</button>
                </div>
                <svg id="canvas" width="800" height="600"></svg>
            </div>
        `;

        container = document.getElementById('app');
        canvas = document.getElementById('canvas');
        app = new MindMap();
    });

    afterEach(() => {
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
    });

    describe('1. 기본 초기화 테스트', () => {
        it('MindMap 인스턴스가 생성되어야 함', () => {
            expect(app).toBeTruthy();
            expect(app.nodes).toEqual([]);
            expect(app.connections).toEqual([]);
            expect(app.connectMode).toBe(false);
            expect(app.lineStyle).toBe('solid');
        });

        it('나이트 모드 테마가 적용되어야 함', () => {
            expect(container.classList.contains('night-theme')).toBe(true);
        });

        it('모든 필수 버튼이 존재해야 함', () => {
            expect(document.getElementById('addCircle')).toBeTruthy();
            expect(document.getElementById('addRect')).toBeTruthy();
            expect(document.getElementById('connectMode')).toBeTruthy();
            expect(document.getElementById('lineStyle')).toBeTruthy();
            expect(document.getElementById('clear')).toBeTruthy();
        });
    });

    describe('2. 노드 생성 테스트', () => {
        it('원형 노드를 생성할 수 있어야 함', () => {
            document.getElementById('addCircle').click();

            expect(app.nodes.length).toBe(1);
            expect(app.nodes[0].type).toBe('circle');
            expect(app.nodes[0].x).toBe(400); // 중앙
            expect(app.nodes[0].y).toBe(300); // 중앙
        });

        it('사각형 노드를 생성할 수 있어야 함', () => {
            document.getElementById('addRect').click();

            expect(app.nodes.length).toBe(1);
            expect(app.nodes[0].type).toBe('rect');
        });

        it('노드 클릭 시 선택되어야 함', () => {
            document.getElementById('addCircle').click();
            const node = app.nodes[0];

            // 노드 클릭 시뮬레이션
            const clickEvent = new MouseEvent('click', {
                bubbles: true,
                clientX: 400,
                clientY: 300
            });
            node.element.dispatchEvent(clickEvent);

            expect(app.selectedNode).toBe(node);
            expect(node.element.classList.contains('selected')).toBe(true);
        });

        it('노드 더블클릭 시 텍스트 편집 모드로 진입해야 함', () => {
            document.getElementById('addCircle').click();
            const node = app.nodes[0];

            const dblClickEvent = new MouseEvent('dblclick', {
                bubbles: true,
                clientX: 400,
                clientY: 300
            });
            node.element.dispatchEvent(dblClickEvent);

            expect(app.isEditing).toBe(true);
        });
    });

    describe('3. 연결 기능 테스트', () => {
        beforeEach(() => {
            // 테스트용 노드 2개 생성
            document.getElementById('addCircle').click();
            document.getElementById('addRect').click();
            app.nodes[1].x = 600;
            app.nodes[1].y = 300;
        });

        it('연결 모드를 토글할 수 있어야 함', () => {
            const connectBtn = document.getElementById('connectMode');

            expect(app.connectMode).toBe(false);
            connectBtn.click();
            expect(app.connectMode).toBe(true);

            connectBtn.click();
            expect(app.connectMode).toBe(false);
        });

        it('연결 모드에서 두 노드를 연결할 수 있어야 함', () => {
            const connectBtn = document.getElementById('connectMode');
            const node1 = app.nodes[0];
            const node2 = app.nodes[1];

            // 연결 모드 활성화
            connectBtn.click();

            // 첫 번째 노드 클릭
            node1.element.dispatchEvent(new MouseEvent('click', { bubbles: true }));

            // 두 번째 노드 클릭
            node2.element.dispatchEvent(new MouseEvent('click', { bubbles: true }));

            expect(app.connections.length).toBe(1);
            expect(app.connections[0].from).toBe(node1.id);
            expect(app.connections[0].to).toBe(node2.id);
        });

        it('선 스타일을 변경할 수 있어야 함', () => {
            const lineStyleBtn = document.getElementById('lineStyle');

            expect(app.lineStyle).toBe('solid');
            lineStyleBtn.click();
            expect(app.lineStyle).toBe('dashed');

            lineStyleBtn.click();
            expect(app.lineStyle).toBe('solid');
        });
    });

    describe('4. 나이트 모드 색상 테스트', () => {
        it('배경색이 어두운 색이어야 함', () => {
            const computedStyle = window.getComputedStyle(container);
            const bgColor = computedStyle.backgroundColor;

            // RGB 값이 어두운 범위에 있는지 확인
            expect(bgColor).toMatch(/rgb\((\d{1,2}),\s*(\d{1,2}),\s*(\d{1,2})\)/);
        });

        it('노드가 나이트 모드 색상을 사용해야 함', () => {
            document.getElementById('addCircle').click();
            const node = app.nodes[0];

            const fill = node.shape.getAttribute('fill');
            const stroke = node.shape.getAttribute('stroke');

            expect(['#2a2a2a', '#3a3a3a', '#4a4a4a'].includes(fill)).toBe(true);
            expect(['#666', '#777', '#888'].includes(stroke)).toBe(true);
        });

        it('텍스트가 밝은 색이어야 함', () => {
            document.getElementById('addCircle').click();
            const node = app.nodes[0];

            const textColor = node.textElement.getAttribute('fill');
            expect(['#ffffff', '#f0f0f0', '#e0e0e0'].includes(textColor)).toBe(true);
        });
    });

    describe('5. 성능 최적화 테스트', () => {
        it('많은 노드 생성 시 성능이 유지되어야 함', () => {
            const startTime = performance.now();

            // 100개 노드 생성
            for (let i = 0; i < 100; i++) {
                app.addNode('circle', Math.random() * 800, Math.random() * 600);
            }

            const endTime = performance.now();
            const duration = endTime - startTime;

            expect(app.nodes.length).toBe(100);
            expect(duration).toBeLessThan(1000); // 1초 이내
        });

        it('연결선 업데이트가 효율적이어야 함', () => {
            // 노드 생성 및 연결
            app.addNode('circle', 100, 100);
            app.addNode('circle', 200, 200);
            app.createConnection(app.nodes[0], app.nodes[1]);

            const startTime = performance.now();

            // 노드 이동 시뮬레이션
            app.nodes[0].x = 300;
            app.nodes[0].y = 300;
            app.updateConnections();

            const endTime = performance.now();
            const duration = endTime - startTime;

            expect(duration).toBeLessThan(50); // 50ms 이내
        });
    });

    describe('6. 개별 삭제 토글 테스트', () => {
        it('삭제 모드를 토글할 수 있어야 함', () => {
            expect(app.deleteMode).toBe(false);

            // 삭제 모드 활성화
            document.getElementById('deleteMode').click();
            expect(app.deleteMode).toBe(true);

            // 삭제 모드 비활성화
            document.getElementById('deleteMode').click();
            expect(app.deleteMode).toBe(false);
        });

        it('삭제 모드 활성화 시 연결 모드가 비활성화되어야 함', () => {
            // 연결 모드 먼저 활성화
            document.getElementById('connectMode').click();
            expect(app.connectMode).toBe(true);

            // 삭제 모드 활성화
            document.getElementById('deleteMode').click();
            expect(app.deleteMode).toBe(true);
            expect(app.connectMode).toBe(false);
        });

        it('삭제 모드에서 노드 클릭 시 즉시 삭제되어야 함', () => {
            // 노드 생성
            app.addNode('circle', 100, 100);
            expect(app.nodes.length).toBe(1);

            // 삭제 모드 활성화
            app.deleteMode = true;

            // 노드 클릭으로 삭제
            const node = app.nodes[0];
            app.deleteNode(node);
            expect(app.nodes.length).toBe(0);
        });

        it('삭제 모드 버튼 UI 상태가 올바르게 업데이트되어야 함', () => {
            const deleteBtn = document.getElementById('deleteMode');

            // 초기 상태
            expect(deleteBtn.classList.contains('active')).toBe(false);
            expect(deleteBtn.getAttribute('title')).toBe('삭제 모드: 비활성');

            // 활성화 후
            app.toggleDeleteMode();
            expect(deleteBtn.classList.contains('active')).toBe(true);
            expect(deleteBtn.getAttribute('title')).toBe('삭제 모드: 활성 (클릭으로 삭제)');
        });
    });

    describe('7. 향상된 다중 선택 테스트', () => {
        beforeEach(() => {
            // 테스트용 노드들 생성
            app.addNode('circle', 100, 100);
            app.addNode('rect', 200, 200);
            app.addNode('circle', 300, 300);
        });

        it('다중 노드 선택 시 함께 드래그되어야 함', () => {
            // 여러 노드 선택
            app.toggleNodeSelection(app.nodes[0]);
            app.toggleNodeSelection(app.nodes[1]);
            expect(app.selectedNodes.length).toBe(2);

            // 다중 드래그 테스트
            const deltaX = 50, deltaY = 50;
            const originalPositions = app.selectedNodes.map(node => ({x: node.x, y: node.y}));

            app.moveSelectedNodes(deltaX, deltaY);

            app.selectedNodes.forEach((node, index) => {
                expect(node.x).toBe(originalPositions[index].x + deltaX);
                expect(node.y).toBe(originalPositions[index].y + deltaY);
            });
        });

        it('다중 노드 삭제 시 확인 대화상자가 표시되어야 함', () => {
            // 여러 노드 선택
            app.toggleNodeSelection(app.nodes[0]);
            app.toggleNodeSelection(app.nodes[1]);
            expect(app.selectedNodes.length).toBe(2);

            // confirm 함수 모킹
            const originalConfirm = window.confirm;
            let confirmCalled = false;
            let confirmMessage = '';
            window.confirm = (message) => {
                confirmCalled = true;
                confirmMessage = message;
                return true; // 삭제 확인
            };

            app.deleteSelected();

            expect(confirmCalled).toBe(true);
            expect(confirmMessage).toMatch(/선택된 2개의 노드를 모두 삭제하시겠습니까/);
            expect(app.nodes.length).toBe(1); // 1개만 남음

            // 원래 함수 복원
            window.confirm = originalConfirm;
        });

        it('다중 드래그 시 캔버스 경계를 벗어나지 않아야 함', () => {
            // 노드를 경계 근처에 배치
            app.nodes[0].x = 50;
            app.nodes[0].y = 50;
            app.nodes[1].x = 100;
            app.nodes[1].y = 100;

            app.toggleNodeSelection(app.nodes[0]);
            app.toggleNodeSelection(app.nodes[1]);

            // 경계를 벗어나는 이동 시도
            app.moveSelectedNodes(-100, -100);

            // 노드들이 경계 안에 있는지 확인
            app.selectedNodes.forEach(node => {
                expect(node.x).toBeLessThan(app.canvas.clientWidth);
                expect(node.y).toBeLessThan(app.canvas.clientHeight);
                expect(node.x).toBeGreaterThan(0);
                expect(node.y).toBeGreaterThan(0);
            });
        });

        it('다중 선택된 노드들의 시각적 피드백이 올바르게 표시되어야 함', () => {
            app.toggleNodeSelection(app.nodes[0]);
            app.toggleNodeSelection(app.nodes[1]);

            const selectedElements = document.querySelectorAll('.node.multi-selected');
            expect(selectedElements.length).toBe(2);
        });
    });

    describe('8. 캔버스 지우기 테스트', () => {
        it('모든 노드와 연결을 지울 수 있어야 함', () => {
            // 노드와 연결 생성
            document.getElementById('addCircle').click();
            document.getElementById('addRect').click();
            app.createConnection(app.nodes[0], app.nodes[1]);

            expect(app.nodes.length).toBe(2);
            expect(app.connections.length).toBe(1);

            // 지우기
            document.getElementById('clear').click();

            expect(app.nodes.length).toBe(0);
            expect(app.connections.length).toBe(0);
        });
    });
});