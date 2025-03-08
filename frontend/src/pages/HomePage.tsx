import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useKeycloak } from '@/KeycloakProvider';
import DynamicForm, { FormField } from '@/components/ui/dynamic-form';

const HomePage: React.FC = () => {
  const { keycloak } = useKeycloak();
  const [formResult, setFormResult] = useState<Record<string, any> | null>(null);

  // Demo form fields
  const demoFormFields: FormField[] = [
    {
      name: 'fullName',
      label: 'Full Name',
      type: 'text',
      placeholder: 'John Doe',
      required: true,
      minLength: 3,
      maxLength: 100,
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      placeholder: 'user@example.com',
      required: true,
    },
    {
      name: 'subscriptionType',
      label: 'Subscription Type',
      type: 'select',
      required: true,
      options: [
        { label: 'Basic', value: 'basic' },
        { label: 'Professional', value: 'professional' },
        { label: 'Enterprise', value: 'enterprise' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32 bg-gradient-to-b from-primary/20 to-background">
        <div className="absolute inset-0 grid grid-cols-3 -z-10 opacity-30">
          <div className="bg-gradient-to-br from-primary to-transparent opacity-20"></div>
          <div className="backdrop-blur-[100px]"></div>
        </div>
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center space-y-4 text-center">
            <Badge variant="outline" className="px-3 py-1 text-sm border-primary/30 bg-primary/10">
              Full Stack Application Demo
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tighter">
              Convex + Keycloak + React
            </h1>
            <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              A modern full-stack application with real-time data synchronization, OAuth 2.0 authentication, and dynamic form generation
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              {keycloak.authenticated ? (
                <Button asChild size="lg">
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
              ) : (
                <Button onClick={() => keycloak.login()} size="lg">
                  Get Started
                </Button>
              )}
              <Button variant="outline" size="lg" asChild>
                <a href="https://github.com/yourusername/convex-react-keycloak" target="_blank" rel="noreferrer">
                  <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path>
                  </svg>
                  GitHub
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-background">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
            <Card className="border border-border bg-card shadow-sm">
              <CardHeader>
                <div className="p-2 bg-primary/10 rounded-md w-10 h-10 flex items-center justify-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>
                </div>
                <CardTitle>Real-Time Synchronization</CardTitle>
                <CardDescription>
                  Powered by Convex backend with built-in real-time data sync capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Experience real-time updates across all connected clients without complex WebSocket or polling setup.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card shadow-sm">
              <CardHeader>
                <div className="p-2 bg-primary/10 rounded-md w-10 h-10 flex items-center justify-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h.01"/><path d="M17 7h.01"/><path d="M7 17h.01"/><path d="M17 17h.01"/></svg>
                </div>
                <CardTitle>Secure Authentication</CardTitle>
                <CardDescription>
                  OAuth 2.0 authentication flow with Keycloak identity provider
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Enterprise-grade security with SSO capabilities, user roles, and flexible authentication flows.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card shadow-sm">
              <CardHeader>
                <div className="p-2 bg-primary/10 rounded-md w-10 h-10 flex items-center justify-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
                </div>
                <CardTitle>Modern UI Components</CardTitle>
                <CardDescription>
                  Built with React, Tailwind CSS and shadcn/ui components
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Responsive, accessible, and customizable UI components that work seamlessly in light and dark modes.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card shadow-sm">
              <CardHeader>
                <div className="p-2 bg-primary/10 rounded-md w-10 h-10 flex items-center justify-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M3 5v14l8-4 8 4V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z"/></svg>
                </div>
                <CardTitle>Dynamic Forms</CardTitle>
                <CardDescription>
                  Powered by @tanstack/react-form and @tanstack/react-table
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Create, validate, and manage complex forms with dynamic fields and powerful data tables with minimal code.
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Tech Stack Section */}
          <div className="space-y-4 text-center mb-12">
            <h2 className="text-2xl font-bold">Powered By Modern Tech Stack</h2>
            <div className="flex flex-wrap justify-center gap-3">
              <Badge variant="secondary">React</Badge>
              <Badge variant="secondary">TypeScript</Badge>
              <Badge variant="secondary">Convex</Badge>
              <Badge variant="secondary">Keycloak</Badge>
              <Badge variant="secondary">Tailwind CSS</Badge>
              <Badge variant="secondary">@tanstack/react-form</Badge>
              <Badge variant="secondary">@tanstack/react-table</Badge>
              <Badge variant="secondary">PostgreSQL</Badge>
              <Badge variant="secondary">Docker</Badge>
              <Badge variant="secondary">Bun</Badge>
              <Badge variant="secondary" className="bg-gradient-to-r from-blue-500/10 to-purple-500/10">AI-Agent Ready</Badge>
            </div>
          </div>

          {/* Dynamic Forms Highlight Section */}
          <div className="mb-12">
            <Card className="overflow-hidden">
              <div className="md:grid md:grid-cols-2">
                <div className="bg-muted p-6 flex flex-col justify-center space-y-4">
                  <h3 className="text-xl font-bold">Dynamic Form Builder</h3>
                  <p className="text-muted-foreground">
                    Create forms with any structure from JSON schema definitions. Built for both human developers and AI agents to easily generate and manage complex forms.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary mr-2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      <span>AI-friendly schema definitions</span>
                    </div>
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary mr-2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      <span>Type-safe form validation</span>
                    </div>
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary mr-2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      <span>Complex field dependencies</span>
                    </div>
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary mr-2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      <span>Programmatic form generation</span>
                    </div>
                  </div>
                  <Button asChild variant="secondary" className="mt-2 w-fit">
                    <Link to="/dynamic-forms">Explore Dynamic Forms</Link>
                  </Button>
                </div>
                <div className="bg-primary/5 p-6 flex items-center justify-center">
                    <div className="bg-card border border-border p-4 rounded-md shadow-sm w-full max-w-sm">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium">Dynamic Form</span>
                                <Badge variant="outline" className="text-xs">Generated</Badge>
                            </div>
                            <DynamicForm 
                              fields={demoFormFields}
                              onSubmit={(data) => {
                                setFormResult(data);
                                console.log('Form submitted:', data);
                              }}
                            />
                            {formResult && (
                              <div className="flex text-xs text-muted-foreground justify-between">
                                <span>Schema-driven</span>
                                <span>TanStack Form</span>
                              </div>
                            )}
                        </div>
                    </div>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Architecture Benefits Section */}
          <section className="py-16">
            <div className="container px-4 md:px-6 mx-auto">
              <div className="text-center mb-12">
                <Badge variant="outline" className="mb-4">Architecture</Badge>
                <h2 className="text-3xl font-bold mb-4">Optimized Architecture</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Built with modern technologies and best practices for scalability, maintainability, and developer experience
                </p>
              </div>

              <div className="grid gap-8">
                {/* Main Architecture Card */}
                <Card className="bg-gradient-to-br from-primary/5 to-background border-primary/20">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.29 7 12 12 20.71 7"></polyline><line x1="12" y1="22" x2="12" y2="12"></line></svg>
                      </div>
                      <div>
                        <CardTitle className="text-2xl">Unified Monorepo Structure</CardTitle>
                        <CardDescription>Clean separation of concerns with integrated development workflow</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-primary/10 rounded-md mt-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>
                          </div>
                          <div>
                            <h4 className="font-medium text-primary">AI-Ready Infrastructure</h4>
                            <p className="text-sm text-muted-foreground">Dynamic form generation and AI-friendly schema definitions make it easy to create and manage complex data structures.</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-primary/10 rounded-md mt-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                          </div>
                          <div>
                            <h4 className="font-medium text-primary">Type-Safe Development</h4>
                            <p className="text-sm text-muted-foreground">End-to-end TypeScript integration with automatic type generation from database to UI.</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-primary/10 rounded-md mt-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h.01"/><path d="M17 7h.01"/><path d="M7 17h.01"/><path d="M17 17h.01"/></svg>
                          </div>
                          <div>
                            <h4 className="font-medium text-primary">Docker Integration</h4>
                            <p className="text-sm text-muted-foreground">Containerized development ensures consistency across platforms with simplified deployment.</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-primary/10 rounded-md mt-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" x2="4" y1="22" y2="15"></line></svg>
                          </div>
                          <div>
                            <h4 className="font-medium text-primary">Cross-Platform Support</h4>
                            <p className="text-sm text-muted-foreground">Setup scripts for both Windows and Unix systems ensure smooth onboarding.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Technology Stack Cards */}
                <div className="grid md:grid-cols-2 gap-8">
                  <Card className="backdrop-blur-sm bg-background/80 border-primary/20">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 19H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5.5"/><path d="M16 19h6"/><path d="M19 16v6"/></svg>
                        </div>
                        <div>
                          <CardTitle>Frontend Development</CardTitle>
                          <CardDescription>Vite + React + TanStack</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="shrink-0">HMR</Badge>
                          <p className="text-sm text-muted-foreground">Lightning-fast Hot Module Replacement updates your app instantly.</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="shrink-0">Bundle</Badge>
                          <p className="text-sm text-muted-foreground">Optimized production bundles with automatic code splitting.</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="shrink-0">UI</Badge>
                          <p className="text-sm text-muted-foreground">Component-driven development with shadcn/ui and TanStack.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="backdrop-blur-sm bg-background/80 border-primary/20">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M3 2v6h6"></path><path d="M21 12A9 9 0 0 0 6 5.3L3 8"></path><path d="M21 22v-6h-6"></path><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"></path></svg>
                        </div>
                        <div>
                          <CardTitle>Backend Architecture</CardTitle>
                          <CardDescription>Convex + Bun Runtime</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="shrink-0">Fast</Badge>
                          <p className="text-sm text-muted-foreground">Significantly faster startup times and better memory efficiency.</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="shrink-0">Secure</Badge>
                          <p className="text-sm text-muted-foreground">Enhanced isolation and security for sensitive operations.</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="shrink-0">Types</Badge>
                          <p className="text-sm text-muted-foreground">Built-in TypeScript support without additional configuration.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Enterprise Features Card */}
                <Card className="bg-gradient-to-br from-background to-primary/5 border-primary/20">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path></svg>
                      </div>
                      <div>
                        <CardTitle>Enterprise-Ready Features</CardTitle>
                        <CardDescription>Built for scalability and security</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="shrink-0">Auth</Badge>
                          <div>
                            <h4 className="font-medium text-primary">Keycloak Integration</h4>
                            <p className="text-sm text-muted-foreground">SSO, role-based access control, and multiple identity providers.</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="shrink-0">Forms</Badge>
                          <div>
                            <h4 className="font-medium text-primary">Dynamic Forms</h4>
                            <p className="text-sm text-muted-foreground">Schema-driven form generation with validation and complex dependencies.</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="shrink-0">Data</Badge>
                          <div>
                            <h4 className="font-medium text-primary">Real-time Sync</h4>
                            <p className="text-sm text-muted-foreground">Automatic data synchronization across all connected clients.</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="shrink-0">Scale</Badge>
                          <div>
                            <h4 className="font-medium text-primary">Scalable Design</h4>
                            <p className="text-sm text-muted-foreground">Built to handle growing user bases and increasing data loads.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <Card className="border-primary/20 bg-primary/5 mt-10">
            <CardHeader>
              <CardTitle className="text-xl">Ready to explore?</CardTitle>
              <CardDescription>
                Try out the demo application with dynamic forms, real-time data, and more
              </CardDescription>
            </CardHeader>
            <CardFooter>
              {keycloak.authenticated ? (
                <Button asChild>
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
              ) : (
                <Button onClick={() => keycloak.login()}>
                  Sign In
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
