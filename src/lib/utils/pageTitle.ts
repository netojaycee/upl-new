import { useMemo } from "react";

export interface PageTitleConfig {
    title: string;
    subtitle?: string;
    icon?: string;
    breadcrumb?: string[];
}

interface PageContextData {
    leagueName?: string;
    teamName?: string;
    playerName?: string;
    matchTitle?: string;
    newsTitle?: string;
}

export const getPageTitle = (pathname: string, contextData?: PageContextData): PageTitleConfig => {
    // Remove leading slash and split into segments
    const segments = pathname.replace(/^\//, '').split('/').filter(Boolean);

    if (segments.length === 0) {
        return {
            title: "Dashboard",
            subtitle: "Welcome back! Here's your overview",
            icon: "📊",
            breadcrumb: ["Home", "Dashboard"]
        };
    }

    const [mainRoute, ...subRoutes] = segments;

    switch (mainRoute) {
        case 'dashboard':
            return {
                title: "Dashboard",
                subtitle: "System Overview & Key Metrics",
                icon: "📊",
                breadcrumb: ["Home", "Dashboard"]
            };

        case 'leagues':
            if (subRoutes.length === 0) {
                return {
                    title: "Leagues & Competitions",
                    subtitle: "Manage all football competitions",
                    icon: "🏆",
                    breadcrumb: ["Home", "Leagues"]
                };
            }

            // Handle league-specific pages
            const leagueSubRoute = subRoutes[1];
            const leagueName = contextData?.leagueName || "League";

            if (!leagueSubRoute) {
                return {
                    title: leagueName,
                    subtitle: "Teams, players and competition details",
                    icon: "🏆",
                    breadcrumb: ["Home", "Leagues", leagueName]
                };
            }

            switch (leagueSubRoute) {
                case 'matches':
                    if (subRoutes[2]) {
                        const matchTitle = contextData?.matchTitle || "Match Details";
                        return {
                            title: matchTitle,
                            subtitle: "Live stats, reports and match analysis",
                            icon: "⚽",
                            breadcrumb: ["Home", "Leagues", leagueName, "Matches", "Details"]
                        };
                    }
                    return {
                        title: `${leagueName} Fixtures`,
                        subtitle: "Schedule and results for this competition",
                        icon: "📅",
                        breadcrumb: ["Home", "Leagues", leagueName, "Fixtures"]
                    };

                case 'team-players':
                    const teamName = contextData?.teamName || "Team";
                    return {
                        title: `${teamName} Squad`,
                        subtitle: `${leagueName} registration`,
                        icon: "👥",
                        breadcrumb: ["Home", "Leagues", leagueName, "Teams", teamName]
                    };

                default:
                    return {
                        title: `${leagueName} Overview`,
                        subtitle: "Competition management and settings",
                        icon: "🏆",
                        breadcrumb: ["Home", "Leagues", leagueName]
                    };
            }

        case 'teams':
            if (subRoutes.length === 0) {
                return {
                    title: "Team Management",
                    subtitle: "All registered football clubs",
                    icon: "🛡️",
                    breadcrumb: ["Home", "Teams"]
                };
            }
            const teamName = contextData?.teamName || "Club Profile";
            return {
                title: teamName,
                subtitle: "Team information, players and statistics",
                icon: "🛡️",
                breadcrumb: ["Home", "Teams", teamName]
            };

        case 'players':
            if (subRoutes.length === 0) {
                return {
                    title: "Player Database",
                    subtitle: "All registered athletes and their profiles",
                    icon: "👤",
                    breadcrumb: ["Home", "Players"]
                };
            }
            const playerName = contextData?.playerName || "Player Profile";
            return {
                title: playerName,
                subtitle: "Career stats, personal info and performance",
                icon: "👤",
                breadcrumb: ["Home", "Players", playerName]
            };

        case 'matches':
            return {
                title: "Match Management",
                subtitle: "All fixtures across competitions",
                icon: "⚽",
                breadcrumb: ["Home", "Matches"]
            };

        case 'venues':
            return {
                title: "Venue Management",
                subtitle: "Stadiums and playing facilities",
                icon: "🏟️",
                breadcrumb: ["Home", "Venues"]
            };

        case 'referees':
            return {
                title: "Officials Management",
                subtitle: "Referee assignments and profiles",
                icon: "👨‍💼",
                breadcrumb: ["Home", "Referees"]
            };

        case 'news':
            if (subRoutes.length === 0) {
                return {
                    title: "News & Updates",
                    subtitle: "Latest announcements and articles",
                    icon: "📰",
                    breadcrumb: ["Home", "News"]
                };
            }
            const newsTitle = contextData?.newsTitle || "News Article";
            return {
                title: newsTitle,
                subtitle: "Full story and details",
                icon: "📰",
                breadcrumb: ["Home", "News", "Article"]
            };

        case 'carousel':
            return {
                title: "Media Carousel",
                subtitle: "Homepage banner and media management",
                icon: "🎠",
                breadcrumb: ["Home", "Media", "Carousel"]
            };

        case 'settings':
            return {
                title: "System Settings",
                subtitle: "Application configuration and preferences",
                icon: "⚙️",
                breadcrumb: ["Home", "Settings"]
            };

        default:
            // Fallback for unknown routes
            const title = mainRoute.charAt(0).toUpperCase() + mainRoute.slice(1);
            return {
                title,
                subtitle: "Page content and management",
                icon: "📄",
                breadcrumb: ["Home", title]
            };
    }
};

export const usePageTitle = (contextData?: PageContextData): PageTitleConfig => {
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

    return useMemo(() => getPageTitle(pathname, contextData), [pathname, contextData]);
};
