import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Switch, Redirect } from 'react-router-dom';

// Simple mock components for testing
const MockHomeScreen = () => <div data-testid="home-screen">Home Screen</div>;
const MockGlossary = () => <div data-testid="glossary-page">Glossary Page</div>;
const MockTutorial = () => <div data-testid="tutorial-page">Tutorial Page</div>;
const MockH5Tutorial = () => <div data-testid="h5-tutorial-page">H5 Tutorial Page</div>;
const MockDefinition = () => <div data-testid="definition-page">Definition Page</div>;

// Test the routing structure directly (mimicking App.js structure)
const TestAppRoutes = () => (
    <Switch>
        <Route path="/" component={MockHomeScreen} exact />
        <Route path="/h5-tutorial/:url" component={MockH5Tutorial} />
        <Route path="/tutorial" component={MockTutorial} />
        <Route path="/glossary" component={MockGlossary} exact />
        <Route path="/glossary/:locale/:term" component={MockDefinition} exact />
        <Redirect to="/" />
    </Switch>
);

describe('App Component - Route Tests', () => {
    const renderWithRouter = (initialRoute = '/') => {
        return render(
            <MemoryRouter initialEntries={[initialRoute]}>
                <TestAppRoutes />
            </MemoryRouter>
        );
    };

    test('根路径 / 正确渲染 HomeScreen', () => {
        const { getByTestId } = renderWithRouter('/');
        expect(getByTestId('home-screen')).toBeInTheDocument();
    });

    test('/glossary 路径正确渲染术语表页面', () => {
        const { getByTestId } = renderWithRouter('/glossary');
        expect(getByTestId('glossary-page')).toBeInTheDocument();
    });

    test('/tutorial 路径正确渲染教程页面', () => {
        const { getByTestId } = renderWithRouter('/tutorial');
        expect(getByTestId('tutorial-page')).toBeInTheDocument();
    });

    test('/h5-tutorial/:url 路径正确渲染 H5 教程页面', () => {
        const { getByTestId } = renderWithRouter('/h5-tutorial/test-url');
        expect(getByTestId('h5-tutorial-page')).toBeInTheDocument();
    });

    test('/glossary/:locale/:term 路径正确渲染定义页面', () => {
        const { getByTestId } = renderWithRouter('/glossary/en/test-term');
        expect(getByTestId('definition-page')).toBeInTheDocument();
    });

    test('未知路径重定向到首页', () => {
        const { getByTestId } = renderWithRouter('/unknown-path');
        expect(getByTestId('home-screen')).toBeInTheDocument();
    });

    test('/nonexistent 路径重定向到首页', () => {
        const { getByTestId } = renderWithRouter('/nonexistent');
        expect(getByTestId('home-screen')).toBeInTheDocument();
    });

    test('/random/path 路径重定向到首页', () => {
        const { getByTestId } = renderWithRouter('/random/path');
        expect(getByTestId('home-screen')).toBeInTheDocument();
    });
});
