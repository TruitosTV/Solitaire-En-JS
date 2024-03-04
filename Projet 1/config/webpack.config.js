const autoprefixer = require('autoprefixer');
const webpack = require('webpack');
const UglifyPlugin = require('uglifyjs-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const paths = require('./paths');
const env = process.env.NODE_ENV;
const config = env === 'development'
    ? require('./development.js')
    : require('./production.js');

const { inject } = config;

const plugins = [
    new CopyWebpackPlugin([{
        from: '**/*',
        transform: (content, path) => {
            let changed = content.toString();
            for (const key in inject) {
                changed = changed.replace(`%${key}%`, inject[key]);
            }
            return changed;
        }
    }], {
        ignore: ['*.png', '*.jpg', '*.jpeg', '*.gif', '*.js', '*.ico', '*.scss']
    }),
    new CopyWebpackPlugin([{
        from: '**/*.{png,jpg,jpeg,gif,ico}',
    }])
];

if (env === 'production') {
    plugins.push(
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('production')
            }
        }),
        new UglifyPlugin({
            output: {
                comments: false
            }
        })
    );
} else {
    plugins.push(
        new webpack.NamedModulesPlugin()
    );
}

module.exports = {
    context: paths.src,
    devtool: 'cheap-module-source-map',
    entry: paths.index,
    output: {
        path: paths.build
    },
    module: {
        strictExportPresence: true,
        rules: [{
            exclude: [
                /\.html$/,
                /\.js$/,
                /\.css$/,
                /\.scss$/,
                /\.json$/,
                /\.svg$/,
                /\.ico/,
                /\.bmp$/,
                /\.gif$/,
                /\.jpe?g$/,
                /\.png$/
            ],
            loader: require.resolve('file-loader'),
            options: {
                name: 'static/media/[name].[hash:8].[ext]'
            }
        }, {
            test: /\.js$/,
            include: paths.src,
            loader: require.resolve('babel-loader'),

            options: {
                presets: [['env', {
                    targets: {
                        uglify: true
                    }
                }]],
                cacheDirectory: true
            }
        }, {
            test: /\.(css|scss)$/,
            use: [
                require.resolve('style-loader'),
                {
                    loader: require.resolve('css-loader'),
                    options: {
                        modules: false,
                        sourceMap: false,
                        localIdentName: env === 'development' ? '[local]' : '[hash:base64:5]'
                    }
                },
                {
                    loader: require.resolve('postcss-loader'),
                    options: {
                        
                        ident: 'postcss',
                        plugins: () => [
                            require('cssnano'),
                            require('postcss-flexbugs-fixes'),
                            autoprefixer({
                                browsers: [
                                    '>1%',
                                    'last 4 versions',
                                    'Firefox ESR',
                                    'not ie < 9' 
                                ],
                                flexbox: 'no-2009'
                            })
                        ]
                    }
                }, {
                    loader: require.resolve('sass-loader'),
                }
            ]
        }]
    },
    plugins: plugins,

    node: {
        dgram: 'empty',
        fs: 'empty',
        net: 'empty',
        tls: 'empty'
    },
    
    performance: {
        hints: false
    }
};
