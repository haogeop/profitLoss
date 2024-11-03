import React, { useEffect, useRef, useState, useMemo } from "react";
import { Button } from "@mui/material"
import * as d3 from 'd3'
import "./index.scss"

interface ProfitLossProps {
    strikePrice?: number // 行权价格
    optionPrice?: number // 期权合约价格
    curPrice?: number // 目前现货价格
}

// 边距 尺寸
const margin = { top: 20, right: 30, bottom: 30, left: 40 } 
const width = 600 - margin.left - margin.right;
const height = 200 - margin.top - margin.bottom;

const ProfitLoss = ({strikePrice, optionPrice, curPrice}: ProfitLossProps) => {
    const svgRef = useRef()
    // const [data, setData] = useState([])
    const [hoveredPrice, setHoveredPrice] = useState<number | null>(null);
    const [hoveredProfitLoss, setHoveredProfitLoss] = useState<number | null>(null);
    const [isAction, setIsAction] = useState<boolean>(false)
    const [profitStatus, setProfitStatus] = useState<null | 'positive' | 'negative'>(null)


    // 参数定义
    const breakeven = useMemo(() => ( Number(strikePrice) + Number(optionPrice) ), [strikePrice, optionPrice]) // 盈亏平衡点
    const maxPrice = useMemo(() => ( Number(strikePrice) * 3 ), [strikePrice]) // 最大现货价格
    const maxProfit = maxPrice - breakeven

    const ProfitNumberStyle = {
        positive: "positive",
        negative: "negative"
    }

    useEffect(() => {    
        const svg = d3.select(svgRef.current)
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`)
    
        // const pointNum = 1000
        const data = d3.range(0, maxPrice, 1).map(price => {
            const profitLoss = price >= strikePrice ? price - breakeven : -optionPrice
            return {price, profitLoss} // {x, y}
        })
        setHoveredPrice(curPrice)
        
        // 设置 x 轴和 y 轴的范围
        const xScale = d3.scaleLinear()
        .domain([0, maxPrice])
        .range([0, width]);
        
        const yScale = d3.scaleLinear()
        .domain([-maxProfit, maxProfit]) // 值的范围在[-optionPrice, d3.max(data, d => d.profitLoss)]， 为了上基准线居中， 将纵轴设为+-maxProfit
        .range([height, 0]);
        
        const marks = ['+', '0', '-']
        const markPositions = [yScale(maxProfit / 2), yScale(0), yScale(-maxProfit / 2)]

        svg.selectAll('*').remove();

        // 绘制背景色矩形 (1)返回[x1y1 x2y2, x3y3, ...] （2）绘制多边形
        const negtivePoints = data.filter((_, index) => data[index].profitLoss <= 0).map((d, i) => (`${xScale(d.price)},${yScale(d.profitLoss)}`))
        const positivePoints = data.filter((d, index) => d.profitLoss > 0).map((d, i) => (`${xScale(d.price)},${yScale(d.profitLoss)}`))
        // 画一个背景板 用于鼠标定位
        svg.append('rect')
            .attr('x', -10).attr('y', -10).attr('width', width + 20).attr('height', height + 20).attr('fill', '#ffff')

        svg.append('polygon')
        .attr('points', negtivePoints.join(' ') + `,${xScale(0)},${yScale(0)}`).attr('fill', 'rgb(249 220 208)')

        svg.append('polygon')
        .attr('points', positivePoints.join(' ')  + `,${positivePoints[positivePoints.length - 1].split(',')[0]},${yScale(0)}`).attr('fill', 'rgb(203 244 204)');
    
         // 创建折线生成器
         const line = d3.line()
         .x(d => xScale(d.price))
         .y(d => yScale(d.profitLoss));
    
        // 绘制数据
        svg.append('path')
            .datum(data.filter(d => d.profitLoss > 0))
            .attr('class', 'line profit')
            .attr('d', line)
            .attr('fill', 'none')
            .attr('stroke', 'green')
            .attr('stroke-width', 4);

        svg.append('path')
            .datum(data.filter(d => d.profitLoss <= 0))
            .attr('class', 'line profit')
            .attr('d', line)
            .attr('fill', 'none')
            .attr('stroke', 'rgb(255 86 8)')
            .attr('stroke-width', 4);

        // Now MEOW Price
        if(curPrice && curPrice <= maxPrice) {
            svg.append('line')
                .attr('x1', xScale(curPrice))
                .attr('x2', xScale(curPrice))
                .attr('y1', yScale(-maxProfit))
                .attr('y2', yScale(maxProfit))
                .attr('stroke', 'rgb(198 203 205)')
                .attr('stroke-width', 1)
        }

        // 绘制边界
        svg.append('line')
            .attr('x1', 0)
            .attr('x2', xScale(maxPrice))
            .attr('y1', yScale(maxProfit))
            .attr('y2', yScale(maxProfit))
            .attr('stroke', 'black')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '5');
        svg.append('line')
        .attr('x1', 0)
        .attr('x2', xScale(maxPrice))
        .attr('y1', yScale(-maxProfit))
        .attr('y2', yScale(-maxProfit))
        .attr('stroke', 'black')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5');
    
         // 绘制基准线
         svg.append('line')
         .attr('x1', xScale(0))
         .attr('y1', yScale(0))
         .attr('x2', xScale(maxPrice))
         .attr('y2', yScale(0))
         .attr('stroke', 'black')
         .attr('stroke-width', 3)
         .attr('stroke-dasharray', '5');

         // 绘制0 和最大值的位置的圆点
         const zeroProfitPoint = data.find(d => d.profitLoss === 0) // 平衡点
         const maxProfitPoint = data[data.length - 1] // 最大现货价格对应的点
         const maxLossPoint = { price: strikePrice, profitLoss: -optionPrice}// 最大亏损点为 现货价格等于行权价格 亏损一个期权价格

        if(zeroProfitPoint) {
            svg.append('circle')
               .attr('cx', xScale(zeroProfitPoint.price))
               .attr('cy', yScale(zeroProfitPoint.profitLoss))
               .attr('r', 6)
               .attr('fill', 'black')
        }
        svg.append('circle').attr('cx', xScale(maxProfitPoint.price)).attr('cy', yScale(maxProfitPoint.profitLoss))
            .attr('r', 6)
            .attr('fill', 'green')
        svg.append('circle')
            .attr('cx', xScale(maxLossPoint.price))
            .attr('cy', yScale(maxLossPoint.profitLoss))
            .attr('r', 6)
            .attr('fill', 'rgb(255 86 8)')

        marks.forEach((item, index) => {
            svg.append('text')
             .attr('x', -10)
             .attr('y', markPositions[index])
             .attr('dy', '.35em') // 垂直居中
             .attr('text-anchor', 'middle')
             .text(item)
             .style('font-size', '20px')
             .style('fill', 'black');
        })

        // 鼠标移动事件
        svg.on('mousemove', (event) => {
            const [x] = d3.pointer(event)
            const price = Math.round(xScale.invert(x)) // 鼠标位置的x轴值

            // 鼠标会获取到数据范围之外的位置
            if(price >= 0 && price <= maxPrice) {
                setHoveredPrice(price)
                const profit = Math.max(0, price - strikePrice) - optionPrice // 计算盈亏
                setHoveredProfitLoss(profit)
            } else if(price < 0) {
                setHoveredPrice(0)
                setHoveredProfitLoss(-optionPrice)
            } else if(price > maxPrice) {
                setHoveredPrice(maxPrice)
                setHoveredProfitLoss(maxProfit)
            }
        })
    }, [strikePrice, optionPrice, curPrice])

    useEffect(() => {
        if(!hoveredProfitLoss || hoveredProfitLoss === 0 ) {
            setProfitStatus(null)
        } else if(hoveredProfitLoss > 0) {
            setProfitStatus('positive')
        } else {
            setProfitStatus('negative')
        }
    }, [hoveredProfitLoss])

    const handleButton = (price: number) => {
        setIsAction(true)
        setHoveredPrice(price)
        setHoveredProfitLoss(price - breakeven)

        setTimeout(() => {
            setIsAction(false)
        }, 500)
    } 

    return (
        <>
            <div className="title">
                Expected Profit & Loss<br />
                <span className={`price ${!profitStatus ? "" : ProfitNumberStyle[profitStatus]}`}>
                    {hoveredProfitLoss && `${hoveredProfitLoss > 0 ? '+' : `${hoveredProfitLoss < 0 ? '-' : null}`} $${Math.abs(hoveredProfitLoss)}`}
                </span>
            </div>
            {strikePrice && optionPrice && (
                <div style={{ position: 'relative' }}>
                    <svg ref={svgRef} />
                    <div className="button-group">
                        <Button variant="text" onClick={() => handleButton(strikePrice)}>Max Loss</Button>
                        <Button variant="text" onClick={() => handleButton(breakeven)}>Breakeven</Button>
                        <Button variant="text" onClick={() => handleButton(maxPrice)}>Max Profit</Button>
                    </div>
                    {
                        hoveredPrice !== null &&
                        <div style={{ position: 'absolute', left: 0, top: 0 }}>
                            <div
                                className={`y-axis ${ isAction ? "move-action" : null}`}
                                style={{
                                    left: `${40 + ((hoveredPrice / (strikePrice * 3)) * width)}px`,
                                    height: `${height}px`,
                                }}
                            />
                            <div
                                className={`${ isAction ? "move-action" : null}`}
                                style={{
                                    position: 'absolute',
                                    width: '40px', // 设置圆的宽度
                                    height: '40px', // 设置圆的高度
                                    left: `${20 + ((hoveredPrice / (strikePrice * 3)) * width)}px`,
                                    top: `${height / 2}px`,
                                    backgroundColor: 'rgba(96, 220, 99, 0.5)',
                                    borderRadius: '50%',
                                    // boxSizing: 'border-box',
                                }}      
                            />
                            <div
                                className={`${ isAction ? "move-action" : null}`}
                                style={{
                                    position: 'absolute',
                                    width: '60px', // 设置圆的宽度
                                    height: '60px', // 设置圆的高度
                                    left: `${10 + ((hoveredPrice / (strikePrice * 3)) * width)}px`,
                                    top: `${height / 2 - 10}px`,
                                    border: '2px solid rgb(96 220 99)',
                                    borderRadius: '50%',
                                    // boxSizing: 'border-box',
                                }}      
                            />
                            <div
                                style={{ left: `${((hoveredPrice / (strikePrice * 3)) * width) - 20}px` }}
                                className="tooltip"
                            >
                                {<div className="tooltip-price">MEOW Price at Exp<br />{hoveredPrice === maxPrice ? "Unlimited" : `$${hoveredPrice}`}</div>}
                            </div>
                        </div>
                    }
                </div>
            )}
        </>
    )
}

export default ProfitLoss