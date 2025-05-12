import { useState, useEffect } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import LoadingSpinner from "./LoadingSpinner";
const Analytics = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:8000/stat/');
        const data = await response.json();
        
        const processedData = {
          ...data,
          products: data.recommendations.labels.map((name, index) => {
            const product = data.products?.find(p => p.product_name === name);
            return {
              id: index + 1,
              name,
              price: data.recommendations.prices[index],
              cartCount: data.cart_stats[product?.product_id] || 0,
              likeCount: data.like_stats[product?.product_id] || 0,
              image: product?.image || "/images/default.png",
              product_id: product?.product_id || null
            };
          })          
        };
        
        setStats(processedData);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchStats();
  }, []);

  const ProductImage = ({ src, alt }) => {
    const [imgSrc, setImgSrc] = useState(src || "/images/default.png");
    const [loaded, setLoaded] = useState(false);

    const handleError = () => {
      if (imgSrc !== "/images/default.png") {
        setImgSrc("/images/default.png");
      }
    };

    return (
      <div className="product-image-container">
        <img
          src={imgSrc}
          alt={alt}
          onError={handleError}
          onLoad={() => setLoaded(true)}
          style={{ opacity: loaded ? 1 : 0 }}
          loading="lazy"
        />
        {!loaded && <div className="image-skeleton" />}
      </div>
    );
  };

  if (loading) return <LoadingSpinner />;

  if (!stats) return <div className="error-message">Данные не загружены</div>;

  const COLORS = ['#1a1a1a', '#4d4d4d', '#808080', '#b3b3b3', '#d9d9d9'];
  const activeProducts = stats.products.filter(p => p.cartCount > 0 || p.likeCount > 0);

  return (
    <div className="analytics-page">
      <header className="page-header">
        <h1>Аналитика GD</h1>
        <h2 className="gemini-title">Gemini 1.5<span className="star">✧</span></h2>
      </header>

      <nav className="analytics-nav">
        {['summary', 'popularity', 'recommendations'].map((tab) => (
          <button
            key={tab}
            className={`nav-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'summary' && 'Общая сводка'}
            {tab === 'popularity' && 'Популярность'}
            {tab === 'recommendations' && 'Рекомендации'}
          </button>
        ))}
      </nav>

      <main className="analytics-content">
        {activeTab === 'summary' && (
          <div className="summary-section">
            <div className="metrics-grid">
              {[
                { title: 'Всего товаров', value: stats.products_count },
                { title: 'Общая стоимость', value: `${stats.total_value.toFixed(2)} ₸` },
                { title: 'Средняя цена', value: `${stats.average_price.toFixed(2)} ₸` }
              ].map((metric, index) => (
                <div key={index} className="metric-card">
                  <h3>{metric.title}</h3>
                  <p>{metric.value}</p>
                </div>
              ))}
            </div>

            <div className="chart-card">
              <h2>Топ-10 товаров по цене</h2>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart 
                    data={[...stats.products]
                      .sort((a, b) => b.price - a.price)
                      .slice(0, 10)}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} tick={false} />
                    <YAxis tick={{ fill: '#333' }} />
                    <Tooltip 
                      contentStyle={{
                        background: '#fff',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Bar dataKey="price" fill="#1a1a1a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'popularity' && (
          <div className="popularity-section">
            {stats?.products_count > 0 ? (
              <>
                <div className="top-products-grid">
                  {[
                    {
                      title: "Самый добавляемый в корзину",
                      getProduct: () => {
                        const productId = Object.entries(stats.cart_stats)
                          .sort(([,a], [,b]) => b - a)[0]?.[0];
                        return stats.products?.find(p => p.product_id == productId);
                      },
                      statText: (p) => p ? `Добавлен в корзину: ${stats.cart_stats[p.product_id] || 0} раз` : "Нет данных"
                    },
                    {
                      title: "Самый лайкаемый",
                      getProduct: () => {
                        const productId = Object.entries(stats.like_stats)
                          .sort(([,a], [,b]) => b - a)[0]?.[0];
                        return stats.products?.find(p => p.product_id == productId);
                      },
                      statText: (p) => p ? `Добавлено в любимые: ${stats.like_stats[p.product_id] || 0} раз` : "Нет данных"
                    },
                    {
                      title: "Самый продаваемый",
                      getProduct: () => stats.products?.find(p => p.product_id === stats.most_sold?.product_id),
                      statText: (p) => p ? `Продано: ${stats.most_sold?.sold_count || 0} шт` : "Нет данных"
                    },
                    {
                      title: "Большой потенциал",
                      getProduct: () => {
                        const productsWithActivity = stats.products?.filter(p => 
                          (stats.cart_stats[p.product_id] > 0 || stats.like_stats[p.product_id] > 0) && 
                          (!stats.most_sold || p.product_id !== stats.most_sold.product_id)
                        );
                        return productsWithActivity?.sort((a, b) => 
                          ((stats.cart_stats[b.product_id] || 0) * 0.7 + (stats.like_stats[b.product_id] || 0) * 0.3) - 
                          ((stats.cart_stats[a.product_id] || 0) * 0.7 + (stats.like_stats[a.product_id] || 0) * 0.3)
                        )[0];
                      },
                      statText: (p) => p ? 
                        `В корзине: ${stats.cart_stats[p.product_id] || 0} раз, Лайков: ${stats.like_stats[p.product_id] || 0}` : 
                        "Нет данных"
                    }
                  ].map((item, index) => {
                    const product = item.getProduct();
                    
                    if (!product) {
                      return (
                        <div className="top-product-card" key={index}>
                          <h3>{item.title}</h3>
                          <ProductImage src={null} alt="Нет данных" />
                          <p className="product-name">Нет данных</p>
                          <p className="product-stat">Нет данных</p>
                        </div>
                      );
                    }

                    return (
                      <div className="top-product-card" key={index}>
                        <h3 className="card-title">{item.title}</h3>
                        <ProductImage src={product.image} alt={product.name} />
                        <p className="product-name">{product.name}</p>
                        <p className="product-stat">
                          {item.statText(product)}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <div className="charts-grid">
                  <div className="chart-card">
                    <h2>Добавления в корзину</h2>
                    <div className="chart-container">
                      <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                          <Pie
                            data={activeProducts.filter(p => p.cartCount > 0)}
                            cx="50%"
                            cy="50%"
                            outerRadius={120}
                            dataKey="cartCount"
                            label={({ name, cartCount }) => `${name}: ${cartCount}`}
                          >
                            {activeProducts.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name) => [`${value} раз`, name]}
                            contentStyle={{
                              background: '#fff',
                              border: '1px solid #ddd',
                              borderRadius: '4px'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="chart-card">
                    <h2>Лайки товаров</h2>
                    <div className="chart-container">
                      <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                          <Pie
                            data={activeProducts.filter(p => p.likeCount > 0)}
                            cx="50%"
                            cy="50%"
                            outerRadius={120}
                            dataKey="likeCount"
                            label={({ name, likeCount }) => `${name}: ${likeCount}`}
                          >
                            {activeProducts.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name) => [`${value} лайков`, name]}
                            contentStyle={{
                              background: '#fff',
                              border: '1px solid #ddd',
                              borderRadius: '4px'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="no-data-message">
                <p>Нет данных о популярности товаров</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="recommendations-section">
            <div className="analysis-card">
              <h2>Анализ и рекомендации</h2>
              <div className="analysis-content">
                {stats.analysis.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
      .card-title {
  display: block !important;
  position: relative;
  z-index: 10; /* Можно уменьшить с 9999 */
  width: 100%;
  margin: 0 0 10px 0;
  padding: 8px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333; /* Вместо красного */
  text-align: center;
}
  .top-products-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* 4 колонки вместо 2 */
  gap: 16px;
  width: 100%;
  margin-bottom: 24px;
}

.top-product-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.2s;
  min-height: 320px; /* Уменьшенная высота */
}

.product-image-container {
  width: 100%;
  height: 150px; /* Уменьшенная высота контейнера */
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 8px;
}

.product-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  background: #f8f8f8;
  padding: 8px;
}

.product-name {
  font-weight: 500;
  margin: 4px 0;
  text-align: center;
  font-size: 0.9rem; /* Уменьшенный размер шрифта */
}

.product-stat {
  color: #666;
  font-size: 0.8rem; /* Уменьшенный размер шрифта */
  text-align: center;
  margin-top: auto; /* Прижимаем к низу карточки */
}
      .gemini-title {
    font-weight: bold;
    background: linear-gradient(90deg, #a1c4fd, #c2e9fb, #d4b8ff, #a1c4fd);
    background-size: 300% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    animation: gradient 4s ease infinite;
    display: inline-block;
  }
  
  .star {
    color: #d4b8ff;
    margin-left: 0.3rem;
    animation: pulse 2s ease infinite;
  }
  
  @keyframes gradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  @keyframes pulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.3); opacity: 0.7; }
    100% { transform: scale(1); opacity: 1; }
  }
        .top-product-card {
  position: relative;
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  text-align: center;
  overflow: hidden;
}

.top-product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.product-image {
  width: 100%;
  height: 160px;
  object-fit: contain;
  border-radius: 8px;
  margin: 12px 0;
  background: #f8f8f8;
  padding: 10px;
}

.product-name {
  font-size: 1.1rem;
  font-weight: 500;
  margin: 8px 0;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-stat {
  font-size: 0.95rem;
  color: #666;
  margin: 6px 0 0;
}
        .analytics-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          font-family: 'Inter', sans-serif;
          color: #333;
        }
        
        .loading-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 50vh;
        }
        
        .loading-spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #1a1a1a;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .error-message {
          text-align: center;
          padding: 2rem;
          color: #d32f2f;
          font-size: 1.2rem;
        }
        
        .page-header {
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #eee;
        }
        
        .page-header h1 {
          font-size: 1.8rem;
          font-weight: 600;
          margin: 0;
        }
        
        .analytics-nav {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          border-bottom: 1px solid #eee;
        }
        
        .nav-tab {
          padding: 0.75rem 1.5rem;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          position: relative;
          color: #666;
          transition: all 0.2s;
        }
        
        .nav-tab:after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 100%;
          height: 2px;
          background: transparent;
          transition: all 0.2s;
        }
        
        .nav-tab.active {
          color: #1a1a1a;
          font-weight: 500;
        }
        
        .nav-tab.active:after {
          background: #1a1a1a;
        }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-bottom: 3rem;
        }
        
        .metric-card {
          background: #fff;
          border: 1px solid #eee;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        .metric-card h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          font-weight: 500;
          color: #666;
        }
        
        .metric-card p {
          margin: 0;
          font-size: 1.8rem;
          font-weight: 600;
        }
        
        .chart-card {
          background: #fff;
          border: 1px solid #eee;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        .chart-card h2 {
          margin-top: 0;
          margin-bottom: 1.5rem;
          font-size: 1.25rem;
        }
        
        .chart-container {
          width: 100%;
          height: 400px;
        }
        
        .top-products-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .top-product-card {
          background: #fff;
          border: 1px solid #eee;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        .top-product-card h3 {
          margin-top: 0;
          margin-bottom: 0.5rem;
          font-size: 1rem;
          font-weight: 500;
          color: #666;
        }
        
        .product-name {
          margin: 0 0 0.25rem 0;
          font-size: 1.25rem;
          font-weight: 600;
        }
        
        .product-stat {
          margin: 0;
          color: #666;
        }
        
        .charts-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }
        
        .no-data-message {
          text-align: center;
          padding: 2rem;
          color: #666;
        }
        
        .analysis-card {
          background: #fff;
          border: 1px solid #eee;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        .analysis-content p {
          margin-bottom: 1rem;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
};

export default Analytics;