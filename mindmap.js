/**
 * Night Mode Minimal MindMap
 * TDD 기반 최적화된 마인드맵 구현
 */
class MindMap {
    constructor() {
        // 핵심 데이터
        this.nodes = [];
        this.connections = [];
        this.selectedNode = null;
        this.selectedConnection = null;

        // 상태 관리
        this.connectMode = false;
        this.deleteMode = false;
        this.lineStyle = 'solid'; // 'solid' | 'dashed'
        this.isEditing = false;
        this.nodeCounter = 0;

        // 선택 상태
        this.selectedNodes = [];
        this.isSelecting = false;
        this.selectionStart = { x: 0, y: 0 };
        this.selectionBox = null;
        this.justFinishedDragSelection = false;

        // 연결 상태
        this.isConnecting = false;
        this.connectingFrom = null;
        this.tempLine = null;

        // DOM 요소
        this.canvas = document.getElementById('canvas');
        this.app = document.getElementById('app');

        // 성능 최적화용
        this.animationFrame = null;
        this.updateQueue = new Set();

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupCanvas();
        this.updateLineStyleButton(); // 초기 버튼 상태 설정
        console.log('🌙 MindMap 초기화 완료');
    }

    setupEventListeners() {
        // 툴바 버튼 이벤트
        document.getElementById('addCircle').addEventListener('click', () => {
            this.addNode('circle');
        });

        document.getElementById('addRect').addEventListener('click', () => {
            this.addNode('rect');
        });

        document.getElementById('connectMode').addEventListener('click', () => {
            this.toggleConnectMode();
        });

        document.getElementById('lineStyle').addEventListener('click', () => {
            this.toggleLineStyle();
        });

        document.getElementById('deleteMode').addEventListener('click', () => {
            this.toggleDeleteMode();
        });

        document.getElementById('clear').addEventListener('click', () => {
            this.clearCanvas();
        });


        // 캔버스 이벤트
        this.canvas.addEventListener('click', (e) => {
            this.handleCanvasClick(e);
        });

        this.canvas.addEventListener('mousedown', (e) => {
            this.handleCanvasMouseDown(e);
        });

        this.canvas.addEventListener('mousemove', (e) => {
            this.handleCanvasMouseMove(e);
        });

        this.canvas.addEventListener('mouseup', (e) => {
            this.handleCanvasMouseUp(e);
        });

        // 키보드 이벤트
        document.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });
    }

    setupCanvas() {
        // 캔버스 크기 설정
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
    }

    // ========== 노드 관리 ==========

    addNode(type, x = null, y = null) {
        const rect = this.canvas.getBoundingClientRect();

        // 겹치지 않는 위치 찾기
        let nodeX, nodeY;
        if (x !== null && y !== null) {
            nodeX = x;
            nodeY = y;
        } else {
            const position = this.findNonOverlappingPosition(rect.width, rect.height);
            nodeX = position.x;
            nodeY = position.y;
        }

        const node = {
            id: `node_${++this.nodeCounter}`,
            type: type,
            x: nodeX,
            y: nodeY,
            width: 60,
            height: 60,
            text: `Node ${this.nodeCounter}`,
            element: null,
            shape: null,
            textElement: null
        };

        this.createNodeElement(node);
        this.nodes.push(node);
        this.selectNode(node);

        return node;
    }

    findNonOverlappingPosition(canvasWidth, canvasHeight) {
        const nodeSize = 60;
        const margin = 20;
        const gridSize = nodeSize + margin;

        // 그리드 기반으로 위치 탐색
        const cols = Math.floor((canvasWidth - margin * 2) / gridSize);
        const rows = Math.floor((canvasHeight - margin * 2) / gridSize);

        // 기존 노드들의 그리드 위치 계산
        const occupiedPositions = new Set();
        this.nodes.forEach(node => {
            const gridX = Math.round((node.x - margin - nodeSize/2) / gridSize);
            const gridY = Math.round((node.y - margin - nodeSize/2) / gridSize);
            occupiedPositions.add(`${gridX},${gridY}`);
        });

        // 빈 위치 찾기 (중앙부터 나선형으로 탐색)
        const centerX = Math.floor(cols / 2);
        const centerY = Math.floor(rows / 2);

        for (let radius = 0; radius < Math.max(cols, rows); radius++) {
            // 중심점 체크
            if (radius === 0) {
                if (!occupiedPositions.has(`${centerX},${centerY}`)) {
                    return {
                        x: margin + centerX * gridSize + nodeSize/2,
                        y: margin + centerY * gridSize + nodeSize/2
                    };
                }
                continue;
            }

            // 나선형으로 주변 위치 체크
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dy = -radius; dy <= radius; dy++) {
                    if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;

                    const gridX = centerX + dx;
                    const gridY = centerY + dy;

                    if (gridX >= 0 && gridX < cols && gridY >= 0 && gridY < rows) {
                        if (!occupiedPositions.has(`${gridX},${gridY}`)) {
                            return {
                                x: margin + gridX * gridSize + nodeSize/2,
                                y: margin + gridY * gridSize + nodeSize/2
                            };
                        }
                    }
                }
            }
        }

        // 빈 위치가 없으면 랜덤 위치 (겹침 허용)
        return {
            x: margin + Math.random() * (canvasWidth - margin * 2),
            y: margin + Math.random() * (canvasHeight - margin * 2)
        };
    }

    createNodeElement(node) {
        // 노드 그룹 생성
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.classList.add('node');
        group.setAttribute('data-node-id', node.id);

        // 도형 생성
        let shape;
        if (node.type === 'circle') {
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            shape.setAttribute('cx', node.x);
            shape.setAttribute('cy', node.y);
            shape.setAttribute('r', node.width / 2);
        } else {
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            shape.setAttribute('x', node.x - node.width / 2);
            shape.setAttribute('y', node.y - node.height / 2);
            shape.setAttribute('width', node.width);
            shape.setAttribute('height', node.height);
            shape.setAttribute('rx', 8); // 둥근 모서리
        }

        // 텍스트 생성
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', node.x);
        text.setAttribute('y', node.y);
        text.textContent = node.text;

        // 요소 조합
        group.appendChild(shape);
        group.appendChild(text);

        // 이벤트 바인딩
        this.bindNodeEvents(group, node);

        // DOM에 추가
        this.canvas.appendChild(group);

        // 참조 저장
        node.element = group;
        node.shape = shape;
        node.textElement = text;
    }

    bindNodeEvents(element, node) {
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };
        let dragHappened = false;

        element.addEventListener('mousedown', (e) => {
            e.stopPropagation();

            if (this.connectMode) {
                this.handleConnectionClick(node);
                return;
            }

            // Ctrl/Cmd + 클릭으로 다중 선택
            if (e.ctrlKey || e.metaKey) {
                this.toggleNodeSelection(node);
                return;
            }

            // 드래그 시작
            isDragging = true;
            dragHappened = false;
            const rect = this.canvas.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left - node.x;
            dragOffset.y = e.clientY - rect.top - node.y;

            if (!this.selectedNodes.includes(node)) {
                this.selectNode(node);
            }
        });

        element.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.deleteMode && !dragHappened) {
                // 삭제 모드에서는 클릭으로 즉시 삭제
                this.deleteNode(node);
                return;
            }
            if (!this.connectMode && !dragHappened) {
                if (!(e.ctrlKey || e.metaKey)) {
                    this.selectNode(node);
                }
            }
        });

        element.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.startTextEdit(node);
        });

        // 우클릭으로 개별 노드 삭제
        element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.deleteNode(node);
        });

        // 전역 마우스 이벤트
        const handleMouseMove = (e) => {
            if (!isDragging) return;

            dragHappened = true;
            const rect = this.canvas.getBoundingClientRect();
            const newX = e.clientX - rect.left - dragOffset.x;
            const newY = e.clientY - rect.top - dragOffset.y;

            // 다중 선택된 노드들을 함께 이동
            if (this.selectedNodes.length > 1) {
                this.moveSelectedNodes(newX - node.x, newY - node.y);
            } else {
                this.moveNode(node, newX, newY);
            }
        };

        const handleMouseUp = () => {
            if (isDragging) {
                isDragging = false;
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);

                // 짧은 시간 후 dragHappened 리셋
                setTimeout(() => {
                    dragHappened = false;
                }, 10);
            }
        };

        element.addEventListener('mousedown', () => {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        });
    }

    moveNode(node, x, y) {
        node.x = x;
        node.y = y;

        // 도형 위치 업데이트
        if (node.type === 'circle') {
            node.shape.setAttribute('cx', x);
            node.shape.setAttribute('cy', y);
        } else {
            node.shape.setAttribute('x', x - node.width / 2);
            node.shape.setAttribute('y', y - node.height / 2);
        }

        // 텍스트 위치 업데이트
        node.textElement.setAttribute('x', x);
        node.textElement.setAttribute('y', y);

        // 연결선 업데이트 (성능 최적화)
        this.queueConnectionUpdate();
    }

    selectNode(node) {
        // 기존 선택 해제
        this.deselectAll();

        this.selectedNode = node;
        this.selectedNodes = [node];
        node.element.classList.add('selected');
        this.updateSelectionInfo();
    }

    toggleNodeSelection(node) {
        if (this.selectedNodes.includes(node)) {
            // 선택 해제
            this.selectedNodes = this.selectedNodes.filter(n => n !== node);
            node.element.classList.remove('selected', 'multi-selected');

            if (this.selectedNodes.length === 0) {
                this.selectedNode = null;
            } else if (this.selectedNodes.length === 1) {
                this.selectedNode = this.selectedNodes[0];
                this.selectedNodes[0].element.classList.remove('multi-selected');
                this.selectedNodes[0].element.classList.add('selected');
            }
        } else {
            // 선택 추가
            this.selectedNodes.push(node);

            if (this.selectedNodes.length === 1) {
                this.selectedNode = node;
                node.element.classList.add('selected');
            } else {
                // 다중 선택 모드
                this.selectedNode = null;
                this.selectedNodes.forEach(n => {
                    n.element.classList.remove('selected');
                    n.element.classList.add('multi-selected');
                });
            }
        }
        this.updateSelectionInfo();
    }

    moveSelectedNodes(deltaX, deltaY) {
        // 캔버스 경계 체크를 위한 계산
        const rect = this.canvas.getBoundingClientRect();
        const nodeRadius = 30;

        // 모든 선택된 노드가 경계 내에 있는지 확인
        const validMove = this.selectedNodes.every(node => {
            const newX = node.x + deltaX;
            const newY = node.y + deltaY;
            return newX >= nodeRadius &&
                   newX <= rect.width - nodeRadius &&
                   newY >= nodeRadius &&
                   newY <= rect.height - nodeRadius;
        });

        // 유효한 이동만 수행
        if (validMove) {
            this.selectedNodes.forEach(node => {
                this.moveNode(node, node.x + deltaX, node.y + deltaY);
            });
        }
    }

    deselectAll() {
        this.nodes.forEach(node => {
            node.element.classList.remove('selected', 'multi-selected');
        });
        this.connections.forEach(conn => {
            conn.element.classList.remove('selected');
        });
        this.selectedNode = null;
        this.selectedNodes = [];
        this.selectedConnection = null;
        this.updateSelectionInfo();
    }

    updateSelectionInfo() {
        // 선택된 노드 수를 콘솔에 표시 (선택사항)
        if (this.selectedNodes.length > 1) {
            console.log(`${this.selectedNodes.length}개 노드 선택됨`);
        }
    }

    // ========== 텍스트 편집 ==========

    startTextEdit(node) {
        if (this.isEditing) return;

        this.isEditing = true;
        const rect = this.canvas.getBoundingClientRect();

        // 임시 입력 필드 생성
        const input = document.createElement('input');
        input.type = 'text';
        input.value = node.text;
        input.className = 'text-input';
        input.style.left = `${rect.left + node.x - 50}px`;
        input.style.top = `${rect.top + node.y - 10}px`;
        input.style.width = '100px';

        document.body.appendChild(input);
        input.focus();
        input.select();

        const finishEdit = () => {
            const newText = input.value.trim() || `Node ${node.id.split('_')[1]}`;
            node.text = newText;
            node.textElement.textContent = newText;

            document.body.removeChild(input);
            this.isEditing = false;
        };

        input.addEventListener('blur', finishEdit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                finishEdit();
            } else if (e.key === 'Escape') {
                document.body.removeChild(input);
                this.isEditing = false;
            }
        });
    }

    // ========== 연결 기능 ==========

    toggleConnectMode() {
        this.connectMode = !this.connectMode;
        const btn = document.getElementById('connectMode');

        if (this.connectMode) {
            btn.classList.add('active');
            this.canvas.classList.add('connect-mode');
            this.cancelConnection();
        } else {
            btn.classList.remove('active');
            this.canvas.classList.remove('connect-mode');
            this.cancelConnection();
        }
    }

    handleConnectionClick(node) {
        if (!this.isConnecting) {
            this.startConnection(node);
        } else {
            this.endConnection(node);
        }
    }

    startConnection(node) {
        this.isConnecting = true;
        this.connectingFrom = node;

        // 임시 연결선 생성
        this.tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        this.tempLine.classList.add('temp-connection');
        this.tempLine.setAttribute('x1', node.x);
        this.tempLine.setAttribute('y1', node.y);
        this.tempLine.setAttribute('x2', node.x);
        this.tempLine.setAttribute('y2', node.y);
        this.canvas.appendChild(this.tempLine);
    }

    endConnection(node) {
        if (this.connectingFrom && this.connectingFrom !== node) {
            this.createConnection(this.connectingFrom, node);
        }

        this.cancelConnection();
    }

    cancelConnection() {
        this.isConnecting = false;
        this.connectingFrom = null;

        if (this.tempLine) {
            this.canvas.removeChild(this.tempLine);
            this.tempLine = null;
        }
    }

    createConnection(fromNode, toNode) {
        // 중복 연결 체크
        const exists = this.connections.some(conn =>
            (conn.from === fromNode.id && conn.to === toNode.id) ||
            (conn.from === toNode.id && conn.to === fromNode.id)
        );

        if (exists) return;

        const connection = {
            id: `conn_${Date.now()}`,
            from: fromNode.id,
            to: toNode.id,
            style: this.lineStyle,
            element: null
        };

        this.createConnectionElement(connection, fromNode, toNode);
        this.connections.push(connection);

        return connection;
    }

    createConnectionElement(connection, fromNode, toNode) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.classList.add('connection', connection.style);
        line.setAttribute('x1', fromNode.x);
        line.setAttribute('y1', fromNode.y);
        line.setAttribute('x2', toNode.x);
        line.setAttribute('y2', toNode.y);
        line.setAttribute('marker-end', 'url(#arrowhead)');

        // 이벤트 바인딩
        line.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectConnection(connection);
        });

        // 노드보다 뒤에 배치
        this.canvas.insertBefore(line, this.canvas.firstChild?.nextSibling || null);
        connection.element = line;
    }

    selectConnection(connection) {
        this.deselectAll();
        this.selectedConnection = connection;
        connection.element.classList.add('selected');
    }

    toggleLineStyle() {
        this.lineStyle = this.lineStyle === 'solid' ? 'dashed' : 'solid';
        this.updateLineStyleButton();
    }

    updateLineStyleButton() {
        const btn = document.getElementById('lineStyle');
        const svg = btn.querySelector('svg line');

        if (this.lineStyle === 'solid') {
            btn.setAttribute('title', '선 스타일: 실선');
            btn.setAttribute('data-style', 'solid');
            svg.removeAttribute('stroke-dasharray');
        } else {
            btn.setAttribute('title', '선 스타일: 점선');
            btn.setAttribute('data-style', 'dashed');
            svg.setAttribute('stroke-dasharray', '4,2');
        }
    }

    toggleDeleteMode() {
        this.deleteMode = !this.deleteMode;
        this.updateDeleteModeButton();
        this.updateCanvasMode();

        // 다른 모드들 비활성화
        if (this.deleteMode) {
            if (this.connectMode) {
                this.toggleConnectMode();
            }
        }
    }

    updateDeleteModeButton() {
        const btn = document.getElementById('deleteMode');

        if (this.deleteMode) {
            btn.classList.add('active');
            btn.setAttribute('title', '삭제 모드: 활성 (클릭으로 삭제)');
        } else {
            btn.classList.remove('active');
            btn.setAttribute('title', '삭제 모드: 비활성');
        }
    }

    updateCanvasMode() {
        this.canvas.classList.remove('connect-mode', 'delete-mode');

        if (this.connectMode) {
            this.canvas.classList.add('connect-mode');
        } else if (this.deleteMode) {
            this.canvas.classList.add('delete-mode');
        }
    }

    // ========== 성능 최적화 ==========

    queueConnectionUpdate() {
        if (this.animationFrame) return;

        this.animationFrame = requestAnimationFrame(() => {
            this.updateConnections();
            this.animationFrame = null;
        });
    }

    updateConnections() {
        this.connections.forEach(conn => {
            const fromNode = this.nodes.find(n => n.id === conn.from);
            const toNode = this.nodes.find(n => n.id === conn.to);

            if (fromNode && toNode && conn.element) {
                conn.element.setAttribute('x1', fromNode.x);
                conn.element.setAttribute('y1', fromNode.y);
                conn.element.setAttribute('x2', toNode.x);
                conn.element.setAttribute('y2', toNode.y);
            }
        });
    }

    // ========== 이벤트 핸들러 ==========

    handleCanvasClick(e) {
        if (e.target === this.canvas) {
            if (this.connectMode) {
                this.toggleConnectMode();
            } else if (!this.justFinishedDragSelection) {
                this.deselectAll();
            }
        }
    }

    handleCanvasMouseDown(e) {
        if (e.target === this.canvas && !this.connectMode && !this.isConnecting) {
            // 드래그 선택 시작 (deleteMode에서도 드래그 선택 가능)
            this.startDragSelection(e);
        }
    }

    handleCanvasMouseMove(e) {
        if (this.isConnecting && this.tempLine) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            this.tempLine.setAttribute('x2', x);
            this.tempLine.setAttribute('y2', y);
        }

        if (this.isSelecting) {
            this.updateDragSelection(e);
        }
    }

    handleCanvasMouseUp(e) {
        if (this.isSelecting) {
            this.endDragSelection(e);
        }
    }

    startDragSelection(e) {
        this.isSelecting = true;
        const rect = this.canvas.getBoundingClientRect();
        this.selectionStart.x = e.clientX - rect.left;
        this.selectionStart.y = e.clientY - rect.top;

        // 선택 박스 생성
        this.selectionBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        this.selectionBox.classList.add('selection-box');
        this.selectionBox.setAttribute('x', this.selectionStart.x);
        this.selectionBox.setAttribute('y', this.selectionStart.y);
        this.selectionBox.setAttribute('width', 0);
        this.selectionBox.setAttribute('height', 0);
        this.canvas.appendChild(this.selectionBox);
    }

    updateDragSelection(e) {
        if (!this.isSelecting || !this.selectionBox) return;

        const rect = this.canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        const x = Math.min(this.selectionStart.x, currentX);
        const y = Math.min(this.selectionStart.y, currentY);
        const width = Math.abs(currentX - this.selectionStart.x);
        const height = Math.abs(currentY - this.selectionStart.y);

        this.selectionBox.setAttribute('x', x);
        this.selectionBox.setAttribute('y', y);
        this.selectionBox.setAttribute('width', width);
        this.selectionBox.setAttribute('height', height);

        // 선택 박스 내의 노드들 하이라이트
        this.highlightNodesInSelection(x, y, width, height);
    }

    highlightNodesInSelection(x, y, width, height) {
        this.nodes.forEach(node => {
            const nodeInSelection = this.isNodeInSelection(node, x, y, width, height);

            if (nodeInSelection) {
                if (!node.element.classList.contains('selecting')) {
                    node.element.classList.add('selecting');
                }
            } else {
                node.element.classList.remove('selecting');
            }
        });
    }

    isNodeInSelection(node, x, y, width, height) {
        const nodeRadius = 30; // 노드 크기의 절반

        return node.x + nodeRadius >= x &&
               node.x - nodeRadius <= x + width &&
               node.y + nodeRadius >= y &&
               node.y - nodeRadius <= y + height;
    }

    endDragSelection(e) {
        if (!this.isSelecting) return;

        // 선택된 노드들을 실제 선택 상태로 변경
        const selectedInBox = this.nodes.filter(node =>
            node.element.classList.contains('selecting')
        );

        // 기존 선택 해제
        this.deselectAll();

        // 새로운 선택 적용
        if (selectedInBox.length > 0) {
            this.selectedNodes = selectedInBox;
            if (selectedInBox.length === 1) {
                this.selectedNode = selectedInBox[0];
                selectedInBox[0].element.classList.add('selected');
            } else {
                this.selectedNode = null;
                selectedInBox.forEach(node => {
                    node.element.classList.add('multi-selected');
                });
            }
        }

        // selecting 클래스 제거
        this.nodes.forEach(node => {
            node.element.classList.remove('selecting');
        });

        // 선택 박스 제거
        if (this.selectionBox) {
            this.canvas.removeChild(this.selectionBox);
            this.selectionBox = null;
        }

        this.isSelecting = false;
        this.justFinishedDragSelection = true;

        // 플래그를 짧은 시간 후 리셋
        setTimeout(() => {
            this.justFinishedDragSelection = false;
        }, 50);
    }

    handleKeyDown(e) {
        if (this.isEditing) return;

        switch (e.key) {
            case 'Delete':
            case 'Backspace':
                this.deleteSelected();
                break;
            case 'Escape':
                if (this.connectMode) {
                    this.toggleConnectMode();
                } else {
                    this.deselectAll();
                }
                break;
            case 'c':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.addNode('circle');
                }
                break;
            case 'r':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.addNode('rect');
                }
                break;
        }
    }

    // ========== 유틸리티 ==========

    deleteSelected() {
        if (this.selectedNodes.length > 1) {
            // 다중 선택된 노드들 삭제 - 확인 다이얼로그
            if (confirm(`선택된 ${this.selectedNodes.length}개의 노드를 모두 삭제하시겠습니까?`)) {
                [...this.selectedNodes].forEach(node => {
                    this.deleteNode(node);
                });
            }
        } else if (this.selectedNodes.length === 1) {
            // 단일 노드 삭제
            this.deleteNode(this.selectedNodes[0]);
        } else if (this.selectedConnection) {
            this.deleteConnection(this.selectedConnection);
        }
    }

    deleteNode(node) {
        // 관련 연결 삭제
        this.connections.filter(conn =>
            conn.from === node.id || conn.to === node.id
        ).forEach(conn => {
            this.deleteConnection(conn);
        });

        // 노드 삭제
        this.canvas.removeChild(node.element);
        this.nodes = this.nodes.filter(n => n.id !== node.id);

        // 선택 상태에서 제거
        this.selectedNodes = this.selectedNodes.filter(n => n.id !== node.id);
        if (this.selectedNode === node) {
            this.selectedNode = this.selectedNodes.length > 0 ? this.selectedNodes[0] : null;
        }
    }

    deleteConnection(connection) {
        this.canvas.removeChild(connection.element);
        this.connections = this.connections.filter(c => c.id !== connection.id);
        this.selectedConnection = null;
    }

    clearCanvas() {
        // 모든 노드와 연결 삭제
        [...this.nodes].forEach(node => this.deleteNode(node));
        this.nodeCounter = 0;
        this.deselectAll();
        this.cancelConnection();

        if (this.connectMode) {
            this.toggleConnectMode();
        }
    }

    // ========== 공개 API ==========

    getNodeCount() {
        return this.nodes.length;
    }

    getConnectionCount() {
        return this.connections.length;
    }

    exportData() {
        return {
            nodes: this.nodes.map(node => ({
                id: node.id,
                type: node.type,
                x: node.x,
                y: node.y,
                text: node.text
            })),
            connections: this.connections.map(conn => ({
                id: conn.id,
                from: conn.from,
                to: conn.to,
                style: conn.style
            }))
        };
    }

}