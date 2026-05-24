class HuffmanNode {
    constructor(char, freq) {
        this.char = char;
        this.freq = freq;
        this.left = null;
        this.right = null;
        this.id = Math.random().toString(36).substring(2, 9);
        this.code = '';
    }
}

const state = {
    frequencies: [],
    originalInput: [],
    currentStep: 0,
    totalSteps: 0,
    steps: [],
    autoPlayInterval: null,
    huffmanCodes: new Map(),
    currentSortedArray: []
};

const frequenciesInput = document.getElementById('frequencies');
const generateBtn = document.getElementById('generate-btn');
const resetBtn = document.getElementById('reset-btn');
const prevStepBtn = document.getElementById('prev-step');
const nextStepBtn = document.getElementById('next-step');
const autoPlayBtn = document.getElementById('auto-play');
const stepCounter = document.getElementById('step-counter');
const treeDiv = document.getElementById('tree');
const stepDescription = document.getElementById('step-description');
const codeTableBody = document.getElementById('code-table-body');
const sortedArrayDisplay = document.getElementById('sorted-array');
const currentSortedArray = document.getElementById('current-sorted-array');
const currentArrayDisplay = document.getElementById('current-array-display');
generateBtn.addEventListener('click', generateHuffmanTree);
resetBtn.addEventListener('click', resetVisualization);
prevStepBtn.addEventListener('click', previousStep);
nextStepBtn.addEventListener('click', nextStep);
autoPlayBtn.addEventListener('click', toggleAutoPlay);

function generateHuffmanTree() {
    resetVisualization();
    
    const freqText = frequenciesInput.value.trim();
    if (!freqText) {
        alert('Please enter frequencies.');
        return;
    }

    state.originalInput = freqText.split(',').map(f => parseInt(f.trim())).filter(f => !isNaN(f));
    state.frequencies = [...state.originalInput].sort((a, b) => a - b);
    
    if (state.frequencies.length < 2) {
        alert('Please enter at least 2 frequencies.');
        return;
    }

    displaySortedArray();
    createSteps();
    generateHuffmanCodes();

    updateStepCounter();
    renderCurrentStep();
    
    prevStepBtn.disabled = false;
    nextStepBtn.disabled = false;
    autoPlayBtn.disabled = false;
    
    // Show the current sorted array in tree area
    currentSortedArray.style.display = 'block';
    updateCurrentArray();
}

function displaySortedArray() {
    sortedArrayDisplay.innerHTML = '';
    
    let charCode = 65;
    state.frequencies.forEach((freq, index) => {
        const char = String.fromCharCode(charCode + index);
        const arrayItem = document.createElement('div');
        arrayItem.className = 'array-item leaf fade-in';
        arrayItem.innerHTML = `
            <div>${char}</div>
            <div>${freq}</div>
        `;
        sortedArrayDisplay.appendChild(arrayItem);
    });
}

function updateCurrentArray() {
    currentArrayDisplay.innerHTML = '';
    
    if (state.currentSortedArray.length === 0) return;
    
    state.currentSortedArray.forEach((item, index) => {
        const arrayItem = document.createElement('div');
        arrayItem.className = 'array-item leaf fade-in';
        
        if (typeof item === 'object' && item.char) {
            // It's a HuffmanNode
            arrayItem.innerHTML = `
                <div>${item.char}</div>
                <div>${item.freq}</div>
            `;
        } else if (typeof item === 'number') {
            // It's a frequency number
            const char = String.fromCharCode(65 + index);
            arrayItem.innerHTML = `
                <div>${char}</div>
                <div>${item}</div>
            `;
        }
        
        currentArrayDisplay.appendChild(arrayItem);
    });
}

function createSteps() {
    state.steps = [];
    state.currentStep = 0;

    const nodes = [];
    let charCode = 65;
    for (const freq of state.frequencies) {
        nodes.push(new HuffmanNode(String.fromCharCode(charCode), freq));
        charCode++;
    }
    nodes.sort((a, b) => a.freq - b.freq);
    
    state.currentSortedArray = [...nodes];
    
    state.steps.push({
        description: "Step 1: Initial leaf nodes (sorted by frequency)",
        treeNodes: [...nodes],
        selectedNodes: [],
        newNodes: [],
        sortedArray: [...nodes]
    });

    let queue = [...nodes];
    let stepCount = 1;

while (queue.length > 1) {
   
    queue.sort((a, b) => a.freq - b.freq);

    const left = queue.shift();
    const right = queue.shift();

    stepCount++;
    state.steps.push({
        description: `Step ${stepCount}: Select ${left.char ?? left.freq} and ${right.char ?? right.freq}`,
        treeNodes: getAllTreeNodes(queue, left, right),
        selectedNodes: [left, right],
        newNodes: [],
        sortedArray: queue.map(node => node.freq)
    });

    // Create new parent node
    const parent = new HuffmanNode(null, left.freq + right.freq);
    parent.left = left;
    parent.right = right;

    stepCount++;
    state.steps.push({
        description: `Step ${stepCount}: Combine ${left.freq} + ${right.freq} = ${parent.freq}`,
        treeNodes: getAllTreeNodes(queue, parent),
        selectedNodes: [],
        newNodes: [parent],
        calculation: `${left.freq} + ${right.freq} = ${parent.freq}`,
        sortedArray: [...queue, parent].map(node => node.freq).sort((a, b) => a - b)
    });
    queue.push(parent);
    queue.sort((a, b) => a.freq - b.freq);

    stepCount++;
    state.steps.push({
        description: `Step ${stepCount}: Insert ${parent.freq} back in sorted order`,
        treeNodes: getAllTreeNodes(queue),
        selectedNodes: [],
        newNodes: [],
        sortedArray: queue.map(node => node.freq)
    });
}


    state.totalSteps = state.steps.length;
}

function generateHuffmanCodes() {
    state.huffmanCodes.clear();
    
    const lastStep = state.steps[state.steps.length - 1];
    if (lastStep && lastStep.treeNodes.length > 0) {
        const root = lastStep.treeNodes.reduce((max, node) => 
            node.freq > max.freq ? node : max, lastStep.treeNodes[0]);
        
        function assignCodes(node, code) {
            if (!node) return;
            
            node.code = code;
            
            if (node.char) {
                state.huffmanCodes.set(node.char, {
                    code: code,
                    freq: node.freq
           });
            }
            
            if (node.left) assignCodes(node.left, code + '0');
            if (node.right) assignCodes(node.right, code + '1');
        }
        
        assignCodes(root, '');
        updateCodeTable();
    }
}

function updateCodeTable() {
    codeTableBody.innerHTML = '';
    
    if (state.huffmanCodes.size === 0) {
        codeTableBody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center;">No codes generated yet</td>
            </tr>
        `;
        return;
    }
    
    const codesArray = Array.from(state.huffmanCodes.entries())
        .sort((a, b) => b[1].freq - a[1].freq);
    
    codesArray.forEach(([char, data]) => {
        const row = document.createElement('tr');
        row.className = 'fade-in';
        row.innerHTML = `
            <td>${char}</td>
            <td>${data.freq}</td>
            <td><span class="binary-code">${data.code}</span></td>
            <td>${data.code.length}</td>
        `;
        codeTableBody.appendChild(row);
    });
}

function getAllTreeNodes(queue, ...extraNodes) {
    // Collect everything visible in this step
    const allNodes = [...queue, ...extraNodes];

    // Find the node that acts as a root so far
    let possibleRoot = null;
    for (const node of allNodes) {
        if (!queue.some(n => n.left === node || n.right === node)) {
            possibleRoot = node;
            break;
        }
    }

    const nodesWithChildren = [];

    function addNodeWithChildren(node) {
        if (!node || nodesWithChildren.some(n => n.id === node.id)) return;
        nodesWithChildren.push(node);
        if (node.left) addNodeWithChildren(node.left);
        if (node.right) addNodeWithChildren(node.right);
    }

    // Add everything linked from the latest merged node
    allNodes.forEach(node => addNodeWithChildren(node));

    // If we have a possible root, ensure its full subtree is drawn
    if (possibleRoot) addNodeWithChildren(possibleRoot);

    return nodesWithChildren;
}


function renderCurrentStep() {
    treeDiv.innerHTML = '';
    stepDescription.innerHTML = '';

    if (state.currentStep < 0 || state.currentStep >= state.totalSteps) return;
    const step = state.steps[state.currentStep];
    
    let descriptionHTML = `<div class="fade-in">${step.description}</div>`;
    if (step.calculation) {
        descriptionHTML += `<div class="calculation-box fade-in">
            <span class="addition-animation">${step.calculation}</span>
        </div>`;
    }
    stepDescription.innerHTML = descriptionHTML;

    // Update the current sorted array
    if (step.sortedArray) {
        state.currentSortedArray = step.sortedArray;
        updateCurrentArray();
    }

    renderTree(step.treeNodes, step.selectedNodes, step.newNodes);
    updateStepCounter();
}

function renderTree(nodes, selectedNodes, newNodes) {
    const nodePositions = calculateTreePositions(nodes);
    
    for (const [node, position] of nodePositions) {
        const nodeElement = document.createElement('div');
        let nodeClass = 'node ';
        
        if (node.char) {
            nodeClass += 'leaf-node '; 
        } else if (node === getRootNode(nodes)) {
            nodeClass += 'root-node '; 
        } else {
            nodeClass += 'internal-node '; 
        }
        
        nodeElement.className = nodeClass + 'fade-in';
        
        if (selectedNodes.some(selected => selected.id === node.id)) {
            nodeElement.classList.add('selected-node');
        }
        
        if (newNodes.some(newNode => newNode.id === node.id)) {
            nodeElement.classList.add('new-node');
        }
        
        nodeElement.style.left = `${position.x}px`;
        nodeElement.style.top = `${position.y}px`;
        
        let codeDisplay = '';
        if (node.char && node.code) {
            codeDisplay = `<div class="node-code">${node.code}</div>`;
        }
        
        nodeElement.innerHTML = `
            <div class="node-value">${node.freq}</div>
            ${node.char ? `<div class="node-char">${node.char}</div>` : ''}
            ${codeDisplay}
        `;
        
        treeDiv.appendChild(nodeElement);
    }
    
    setTimeout(() => {
        drawAnimatedLines(nodePositions, treeDiv);
    }, 300);
}

function getRootNode(nodes) {
    return nodes.reduce((max, node) => node.freq > max.freq ? node : max, nodes[0]);
}

function calculateTreePositions(nodes) {
    const positions = new Map();
    const containerWidth = treeDiv.parentElement.clientWidth;
    const containerHeight = treeDiv.parentElement.clientHeight - 30;
    
    let root = getRootNode(nodes);
    
    if (nodes.length > 1) {
        positions.set(root, {
            x: containerWidth / 2 - 30,
            y: 30
        });
        
        let level = 1;
        let nodesInLevel = [root];
        
        while (nodesInLevel.length > 0) {
            const nextLevel = [];
            const levelHeight = 30 + level * 70;
            const levelWidth = containerWidth / Math.pow(2, level);
            
            for (let i = 0; i < nodesInLevel.length; i++) {
                const node = nodesInLevel[i];
                const parentPos = positions.get(node);
                
                if (node.left && nodes.some(n => n.id === node.left.id)) {
                    const leftPos = {
                        x: parentPos.x - (levelWidth / 2),
                        y: levelHeight
                    };
                    positions.set(node.left, leftPos);
                    nextLevel.push(node.left);
                }
                
                if (node.right && nodes.some(n => n.id === node.right.id)) {
                    const rightPos = {
                        x: parentPos.x + (levelWidth / 2),
                        y: levelHeight
                    };
                    positions.set(node.right, rightPos);
                    nextLevel.push(node.right);
                }
            }
            
            nodesInLevel = nextLevel;
            level++;
        }
    } else {
        const horizontalSpacing = containerWidth / (nodes.length + 1);
        nodes.forEach((node, index) => {
            positions.set(node, {
                x: horizontalSpacing * (index + 1) - 30,
                y: containerHeight / 2 - 30
            });
        });
    }
    
    return positions;
}

function drawAnimatedLines(nodePositions, container) {
    for (const [node, position] of nodePositions) {
        if (node.left && nodePositions.has(node.left)) {
            const leftPos = nodePositions.get(node.left);
            drawAnimatedLine(container, position.x + (node.char ? 30 : 27.5), position.y + (node.char ? 60 : 55), leftPos.x + (leftPos.char ? 30 : 27.5), leftPos.y);
            
            const leftLabel = document.createElement('div');
            leftLabel.className = 'code-label fade-in';
            leftLabel.textContent = '0';
            leftLabel.style.left = `${(position.x + leftPos.x) / 2 + 30}px`;
            leftLabel.style.top = `${(position.y + leftPos.y) / 2 + 30}px`;
            container.appendChild(leftLabel);
        }
        
        if (node.right && nodePositions.has(node.right)) {
            const rightPos = nodePositions.get(node.right);
            drawAnimatedLine(container, position.x + (node.char ? 30 : 27.5), position.y + (node.char ? 60 : 55), rightPos.x + (rightPos.char ? 30 : 27.5), rightPos.y);
            
            const rightLabel = document.createElement('div');
            rightLabel.className = 'code-label fade-in';
            rightLabel.textContent = '1';
            rightLabel.style.left = `${(position.x + rightPos.x) / 2 + 30}px`;
            rightLabel.style.top = `${(position.y + rightPos.y) / 2 + 30}px`;
            container.appendChild(rightLabel);
        }
    }
}

function drawAnimatedLine(container, x1, y1, x2, y2) {
    const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    
    const line = document.createElement('div');
    line.className = 'animated-line';
    line.style.setProperty('--line-width', `${length}px`);
    line.style.left = `${x1}px`;
    line.style.top = `${y1}px`;
    line.style.transform = `rotate(${angle}deg)`;
    
    container.appendChild(line);
}

function updateStepCounter() {
    stepCounter.textContent = `Step: ${state.currentStep + 1}/${state.totalSteps}`;
}

function previousStep() {
    if (state.currentStep > 0) {
        state.currentStep--;
        renderCurrentStep();
    }
}

function nextStep() {
    if (state.currentStep < state.totalSteps - 1) {
        state.currentStep++;
        renderCurrentStep();
    }
}

function toggleAutoPlay() {
    if (state.autoPlayInterval) {
        clearInterval(state.autoPlayInterval);
        state.autoPlayInterval = null;
        autoPlayBtn.textContent = 'Auto Play';
    } else {
        autoPlayBtn.textContent = 'Stop Auto Play';
        state.autoPlayInterval = setInterval(() => {
            if (state.currentStep < state.totalSteps - 1) {
                nextStep();
            } else {
                toggleAutoPlay();
            }
        }, 1500);
    }
}

function resetVisualization() {
    state.frequencies = [];
    state.originalInput = [];
    state.currentStep = 0;
    state.totalSteps = 0;
    state.steps = [];
    state.huffmanCodes.clear();
    state.currentSortedArray = [];
    
    if (state.autoPlayInterval) {
        clearInterval(state.autoPlayInterval);
        state.autoPlayInterval = null;
        autoPlayBtn.textContent = 'Auto Play';
    }
    
    treeDiv.innerHTML = '';
    stepDescription.textContent = 'No steps to display yet.';
    sortedArrayDisplay.innerHTML = '<div style="text-align: center; width: 100%;">No input generated yet</div>';
    currentSortedArray.style.display = 'none';
    currentArrayDisplay.innerHTML = '';
    updateStepCounter();
    updateCodeTable();
    
    prevStepBtn.disabled = true;
    nextStepBtn.disabled = true;
    autoPlayBtn.disabled = true;
}

resetVisualization();