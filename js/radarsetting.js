/**
 * Hexo Fluid Radar Chart - Anchored at "20" Compact Edition
 * 策略：锁定 20 的位置，大幅压缩其他层间距，使整体紧密围绕 20
 */

(function() {
    console.log('[Compact 20 Radar] Initializing anchored at 20...');

    function initRadar() {
        var data = window.radarData;
        if (!data || !data.labels || !data.scores) return;

        var container = document.getElementById('radarChart');
        if (!container) return;
        container.innerHTML = '';

        // Tooltip
        var tooltip = document.getElementById('radarTooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'radarTooltip';
            tooltip.style.cssText = "position: fixed; display: none; pointer-events: none; z-index: 9999; padding: 4px 8px; border-radius: 3px; background: rgba(50, 50, 50, 0.9); color: #fff; font-size: 11px; font-family: sans-serif; white-space: nowrap; opacity: 0; transition: opacity 0.2s;";
            document.body.appendChild(tooltip);
        }

        // --- 配置 ---
        var count = data.labels.length;
        var radius = 150; 
        var centerX = 200;
        var centerY = 200;
        var maxScore = 100;
        var levels = 5;
        var svgNS = "http://www.w3.org/2000/svg";
        
        var svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("viewBox", "0 0 400 400");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.style.overflow = "visible";

        // --- 颜色 ---
        var isDark = false;
        if (document.documentElement) {
            var scheme = document.documentElement.getAttribute('data-user-color-scheme') || 
                         document.documentElement.getAttribute('data-default-color-scheme');
            if (scheme === 'dark') isDark = true;
            else if (!scheme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                isDark = true;
            }
        }

        var grayColor = isDark ? '#999999' : '#888888'; 
        var axisColor = isDark ? '#777777' : '#aaaaaa';
        var outerColor = isDark ? '#cccccc' : '#555555';
        var mainColor = '#757575';

        function getPos(angle, r) {
            return {
                x: centerX + Math.cos(angle) * r,
                y: centerY + Math.sin(angle) * r
            };
        }

        var startAngle = -Math.PI / 2;
        var angleStep = (Math.PI * 2) / count;
        var dataPoints = [];

        // --- 1. 轴线 & 外标签 & 数据点 ---
        for (var i = 0; i < count; i++) {
            var angle = startAngle + i * angleStep;
            var endPos = getPos(angle, radius);

            var line = document.createElementNS(svgNS, "line");
            line.setAttribute("x1", centerX);
            line.setAttribute("y1", centerY);
            line.setAttribute("x2", endPos.x);
            line.setAttribute("y2", endPos.y);
            line.setAttribute("stroke", axisColor);
            line.setAttribute("stroke-width", "1");
            svg.appendChild(line);

            var outerPos = getPos(angle, radius + 25);
            var text = document.createElementNS(svgNS, "text");
            text.setAttribute("x", outerPos.x);
            text.setAttribute("y", outerPos.y);
            text.setAttribute("fill", outerColor);
            text.setAttribute("font-size", "12");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("dominant-baseline", "middle");
            text.textContent = data.labels[i];
            svg.appendChild(text);

            var score = data.scores[i];
            var type = data.types ? data.types[i] : "Value";
            var pointPos = getPos(angle, (score / maxScore) * radius);
            dataPoints.push({ x: pointPos.x, y: pointPos.y, score: score, label: data.labels[i], type: type, angle: angle });
        }

        // --- 2. 网格 & 数字 (核心：以 20 为基准大幅内收) ---
        
        // 计算最佳角度 (最右侧扇区中间)
        var bestLabelAngle = startAngle + (angleStep / 2);
        var maxCos = Math.cos(bestLabelAngle);
        for(var k=1; k<count; k++) {
            var ang = startAngle + k * angleStep + (angleStep / 2);
            if (Math.cos(ang) > maxCos) {
                maxCos = Math.cos(ang);
                bestLabelAngle = ang;
            }
        }

        // 【核心逻辑】
        // 标准半径步长 (30)
        var step = radius / levels; 
        
        // 自定义每个层级的数字半径偏移量 (单位: px)
        // 目标：20 (索引 0, l=1) 的偏移量为 0。
        // 其他层级全部向内收缩，靠近 20。
        // 数值越大，收缩越厉害。
        var offsets = {
            1: 0,   // 20: 不动 (基准，位置刚好)
            2: -4,  // 40: 向内拉 4px
            3: -8,  // 60: 向内拉 8px
            4: -12, // 80: 向内拉 12px
            5: -16  // 100: 向内拉 16px (大幅收缩，解决“其他远了”的问题)
        };

        for (var l = 1; l <= levels; l++) {
            var r = step * l; 
            var scoreVal = l * (maxScore / levels); 
            
            // 画网格 (网格线保持原样，只动数字)
            var pointsStr = [];
            for (var i = 0; i < count; i++) {
                var angle = startAngle + i * angleStep;
                var p = getPos(angle, r);
                pointsStr.push(p.x + "," + p.y);
            }
            var polygon = document.createElementNS(svgNS, "polygon");
            polygon.setAttribute("points", pointsStr.join(" "));
            polygon.setAttribute("fill", "none");
            polygon.setAttribute("stroke", grayColor);
            polygon.setAttribute("stroke-width", "1");
            polygon.setAttribute("stroke-opacity", "0.6");
            svg.appendChild(polygon);

            // 计算数字位置：标准半径 + 自定义偏移
            var labelR = r + (offsets[l] || 0);
            
            // 安全限制：不能小于 10
            if (labelR < 10) labelR = 10;

            var pos = getPos(bestLabelAngle, labelR);
            
            var numText = document.createElementNS(svgNS, "text");
            numText.setAttribute("x", pos.x);
            numText.setAttribute("y", pos.y);
            numText.setAttribute("fill", grayColor);
            numText.setAttribute("font-size", "11");
            numText.setAttribute("font-weight", "400");
            numText.setAttribute("text-anchor", "middle");
            numText.setAttribute("dominant-baseline", "middle");
            
            numText.textContent = scoreVal;
            svg.appendChild(numText);
        }

        // --- 3. 数据连线 ---
        var dataPointsStr = dataPoints.map(function(p) { return p.x + "," + p.y; }).join(" ");
        var dataPoly = document.createElementNS(svgNS, "polygon");
        dataPoly.setAttribute("points", dataPointsStr);
        dataPoly.setAttribute("fill", "none");
        dataPoly.setAttribute("stroke", mainColor);
        dataPoly.setAttribute("stroke-width", "2");
        dataPoly.setAttribute("stroke-linejoin", "round");
        svg.appendChild(dataPoly);

        // --- 4. 交互 ---
        var helperLine = document.createElementNS(svgNS, "line");
        helperLine.setAttribute("x1", centerX);
        helperLine.setAttribute("y1", centerY);
        helperLine.setAttribute("stroke", mainColor);
        helperLine.setAttribute("stroke-width", "1");
        helperLine.setAttribute("stroke-dasharray", "3, 3");
        helperLine.style.opacity = "0";
        svg.appendChild(helperLine);

        dataPoints.forEach(function(p) {
            var circle = document.createElementNS(svgNS, "circle");
            circle.setAttribute("cx", p.x);
            circle.setAttribute("cy", p.y);
            circle.setAttribute("r", "3.5");
            circle.setAttribute("fill", isDark ? "#333" : "#fff");
            circle.setAttribute("stroke", mainColor);
            circle.setAttribute("stroke-width", "1.5");
            circle.style.cursor = "pointer";
            
            var show = function(e) {
                circle.setAttribute("r", "6");
                circle.setAttribute("fill", mainColor);
                circle.setAttribute("stroke", isDark ? "#fff" : "#333");
                dataPoly.setAttribute("stroke-width", "3");
                helperLine.setAttribute("x2", p.x);
                helperLine.setAttribute("y2", p.y);
                helperLine.style.opacity = "0.7";
                
                tooltip.innerHTML = '<span style="color:#aaa">' + p.label + '</span>: <b>' + p.score + '</b>';
                tooltip.style.display = "block";
                tooltip.style.opacity = "1";
                tooltip.style.left = e.clientX + "px";
                tooltip.style.top = (e.clientY - 35) + "px";
                tooltip.style.transform = "translate(-50%, 0)";
            };
            
            var hide = function() {
                circle.setAttribute("r", "3.5");
                circle.setAttribute("fill", isDark ? "#333" : "#fff");
                circle.setAttribute("stroke", mainColor);
                dataPoly.setAttribute("stroke-width", "2");
                helperLine.style.opacity = "0";
                tooltip.style.opacity = "0";
                setTimeout(function(){ if(tooltip.style.opacity==="0") tooltip.style.display="none"; }, 200);
            };

            circle.onmouseenter = show;
            circle.onmousemove = show;
            circle.onmouseleave = hide;
            svg.appendChild(circle);
        });

        container.appendChild(svg);
        console.log('[Compact 20 Radar] Rendered anchored at 20.');
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initRadar);
    else setTimeout(initRadar, 50);
})();