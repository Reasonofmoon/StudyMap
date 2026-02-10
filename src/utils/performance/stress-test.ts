import * as d3 from 'd3';

// Stress testing utilities for large datasets
export class StressTestUtility {
  private static instance: StressTestUtility;
  private metrics: {
    fps: number;
    memory: number;
    renderTime: number;
    nodeCount: number;
  } = {
    fps: 0,
    memory: 0,
    renderTime: 0,
    nodeCount: 0
  };

  private constructor() {}

  static getInstance(): StressTestUtility {
    if (!StressTestUtility.instance) {
      StressTestUtility.instance = new StressTestUtility();
    }
    return StressTestUtility.instance;
  }

  /**
   * Generate test data for large datasets
   */
  generateTestData(nodeCount: number = 500000): any[] {
    console.log(`Generating ${nodeCount} test nodes...`);

    const categories = ['vocabulary', 'grammar', 'listening', 'speaking', 'reading', 'writing'];
    const levels = Array.from({ length: 10 }, (_, i) => i + 1);
    const studentLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

    const nodes = [];

    for (let i = 0; i < nodeCount; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const level = levels[Math.floor(Math.random() * levels.length)];
      const studentLevel = studentLevels[Math.floor(Math.random() * studentLevels.length)];

      nodes.push({
        id: `node-${i}`,
        word: `word-${i}`,
        category,
        level,
        score: Math.floor(Math.random() * 100),
        frequency: Math.floor(Math.random() * 100),
        lastReviewed: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        improvement: Math.floor(Math.random() * 40) - 20,
        studentLevel,
        connections: this.generateConnections(i, nodeCount)
      });
    }

    console.log(`Generated ${nodes.length} test nodes`);
    return nodes;
  }

  /**
   * Generate connections for nodes
   */
  private generateConnections(nodeId: number, totalNodes: number): string[] {
    const connections = [];
    const connectionCount = Math.min(Math.floor(Math.random() * 10) + 1, 20);

    for (let i = 0; i < connectionCount; i++) {
      const targetId = Math.floor(Math.random() * totalNodes);
      if (targetId !== nodeId) {
        connections.push(`node-${targetId}`);
      }
    }

    return connections;
  }

  /**
   * Test D3.js performance with large datasets
   */
  async testD3Performance(nodes: any[], container: HTMLElement): Promise<void> {
    console.log('Starting D3.js performance test...');

    // Clear container
    container.innerHTML = '';

    // Create SVG
    const width = container.clientWidth;
    const height = container.clientHeight;
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const startTime = performance.now();

    // Test force simulation
    const simulation = d3.forceSimulation(nodes.slice(0, 10000)) // Limit to 10k for testing
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => 5 + Math.random() * 5));

    // Create nodes
    const node = svg.append('g')
      .selectAll('circle')
      .data(nodes.slice(0, 1000)) // Test with 1k nodes
      .enter().append('circle')
      .attr('r', d => 3 + Math.random() * 3)
      .attr('fill', d => {
        const colors = {
          vocabulary: '#3B82F6',
          grammar: '#10B981',
          listening: '#F59E0B',
          speaking: '#EF4444',
          reading: '#8B5CF6',
          writing: '#EC4899'
        };
        return colors[d.category as keyof typeof colors] || '#6B7280';
      });

    // Update on tick
    simulation.on('tick', () => {
      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
    });

    const endTime = performance.now();
    this.metrics.renderTime = endTime - startTime;
    this.metrics.nodeCount = nodes.length;

    console.log(`D3.js test completed in ${this.metrics.renderTime}ms`);
    console.log(`Processed ${this.metrics.nodeCount} nodes`);
  }

  /**
   * Test heatmap rendering performance
   */
  async testHeatmapPerformance(data: any[], container: HTMLElement): Promise<void> {
    console.log('Starting heatmap performance test...');

    const startTime = performance.now();

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Clear container
    container.innerHTML = '';

    // Create SVG
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // Generate heatmap matrix
    const categories = ['vocabulary', 'grammar', 'listening', 'speaking', 'reading', 'writing'];
    const levels = Array.from({ length: 10 }, (_, i) => i + 1);

    const heatmapData = levels.map(level =>
      categories.map(category => {
        const items = data.filter(d => d.category === category && d.level === level);
        return {
          category,
          level,
          score: items.length > 0 ? items.reduce((sum, item) => sum + item.score, 0) / items.length : 0,
          count: items.length
        };
      })
    );

    // Create scales
    const xScale = d3.scaleBand()
      .domain(categories)
      .range([0, width - 100])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([1, 10])
      .range([height - 100, 0]);

    const colorScale = d3.scaleSequential(d3.interpolateRdYlGn)
      .domain([0, 100]);

    // Create heatmap cells
    const g = svg.append('g')
      .attr('transform', 'translate(50, 50)');

    const cells = g.selectAll('rect')
      .data(heatmapData.flat())
      .enter().append('rect')
      .attr('x', d => xScale(d.category))
      .attr('y', d => yScale(d.level))
      .attr('width', xScale.bandwidth())
      .attr('height', (height - 100) / 10)
      .attr('fill', d => colorScale(d.score))
      .attr('stroke', '#1F2937');

    const endTime = performance.now();
    this.metrics.renderTime = endTime - startTime;

    console.log(`Heatmap test completed in ${this.metrics.renderTime}ms`);
  }

  /**
   * Calculate FPS (Frames Per Second)
   */
  calculateFPS(): void {
    let lastTime = performance.now();
    let frames = 0;

    const measure = () => {
      frames++;
      const currentTime = performance.now();
      if (currentTime >= lastTime + 1000) {
        this.metrics.fps = Math.round((frames * 1000) / (currentTime - lastTime));
        frames = 0;
        lastTime = currentTime;
      }
      requestAnimationFrame(measure);
    };

    measure();
  }

  /**
   * Get memory usage
   */
  getMemoryUsage(): void {
    if (performance && (performance as any).memory) {
      this.metrics.memory = (performance as any).memory.usedJSHeapSize;
    }
  }

  /**
   * Run comprehensive stress test
   */
  async runStressTest(container: HTMLElement): Promise<void> {
    console.log('Running comprehensive stress test...');

    // Start FPS monitoring
    this.calculateFPS();

    // Generate test data
    const testData = this.generateTestData(500000);

    // Run tests
    await this.testD3Performance(testData, container);
    await this.testHeatmapPerformance(testData.slice(0, 10000), container);

    // Get final metrics
    this.getMemoryUsage();

    // Report results
    this.reportResults();
  }

  /**
   * Report test results
   */
  private reportResults(): void {
    console.log('=== STRESS TEST RESULTS ===');
    console.log(`FPS: ${this.metrics.fps}`);
    console.log(`Memory Usage: ${(this.metrics.memory / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Render Time: ${this.metrics.renderTime}ms`);
    console.log(`Node Count: ${this.metrics.nodeCount.toLocaleString()}`);

    // Performance assessment
    const performanceScore = this.calculatePerformanceScore();
    console.log(`\nPerformance Score: ${performanceScore}/100`);

    if (performanceScore >= 80) {
      console.log('✅ Excellent performance');
    } else if (performanceScore >= 60) {
      console.log('⚠️ Good performance with room for improvement');
    } else {
      console.log('❌ Performance needs optimization');
    }
  }

  /**
   * Calculate overall performance score
   */
  private calculatePerformanceScore(): number {
    let score = 0;

    // FPS score (0-30 points)
    if (this.metrics.fps >= 60) score += 30;
    else if (this.metrics.fps >= 30) score += 20;
    else if (this.metrics.fps >= 15) score += 10;

    // Memory score (0-30 points)
    const memoryInMB = this.metrics.memory / 1024 / 1024;
    if (memoryInMB <= 100) score += 30;
    else if (memoryInMB <= 200) score += 20;
    else if (memoryInMB <= 500) score += 10;

    // Render time score (0-40 points)
    if (this.metrics.renderTime <= 100) score += 40;
    else if (this.metrics.renderTime <= 500) score += 30;
    else if (this.metrics.renderTime <= 1000) score += 20;

    return score;
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }
}

// Export singleton instance
export const stressTestUtility = StressTestUtility.getInstance();