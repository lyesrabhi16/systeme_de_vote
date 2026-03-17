import apiClient from '@/api/client';
import {
  type VoteStatusPerMonthResponseModel,
  type FullVoteResponseModel,
  type UserGrowthPerMonthResponseModel,
  type VotesPerMonthResponseModel,
  type VoteWithCreatorResponseModel,
  CurrentUserResponseModelAuthorityEnum,
} from '@/api/sdk/api';
import VoteBadge from '@/components/home/VoteBadge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import AppContainer from '@/components/utils/AppContainer';
import useGlobalStore from '@/services/store';
import { getBadgeType } from '@/utils/vote.utils';
import { Calendar, Clock, User } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
  Sector,
  XAxis,
  YAxis,
} from 'recharts';
import type { PieSectorDataItem } from 'recharts/types/polar/Pie';
import { toast } from 'sonner';

const VOTE_AUTHORITY_DASHBOARD = {
  // Vote Authority
  votesPerMonth: true,
  voteStatus: true,
  participation: true,
  lastFinishedVote: true,
  upcomingVotes: true,
  ongoingVotes: true,
};
const INSCRIPTION_AUTHORITY_DASHBOARD = {
  // Inscription Authority
  userGrowth: true,
  userRoleRepartition: true,
  userActivityRepartition: true,
  userStatistics: true,
};
const AUTHORITY_DASHBOARD = {
  ...VOTE_AUTHORITY_DASHBOARD,
  ...INSCRIPTION_AUTHORITY_DASHBOARD,
};
const get_AUTHORITY_DASHBOARD_SET_TO_FALSE = () => {
  let display_set_to_false = { ...AUTHORITY_DASHBOARD };
  Object.keys(display_set_to_false).forEach((key) => {
    display_set_to_false[key as keyof typeof AUTHORITY_DASHBOARD] = false;
  });
  return display_set_to_false;
};
const AdminPage = () => {
  const { user } = useGlobalStore();
  const [display, setDisplay] = useState<typeof AUTHORITY_DASHBOARD>(
    get_AUTHORITY_DASHBOARD_SET_TO_FALSE(),
  );
  const [votesPerMonthData, setVotesPerMonthData] = useState<
    VotesPerMonthResponseModel[]
  >([]);
  const [userGrowthData, setUserGrowthData] = useState<
    UserGrowthPerMonthResponseModel[]
  >([]);
  const [participationData, setParticipationData] = useState<
    Array<{ status: string; count: number; fill: string }>
  >([]);
  const [voteStatusData, setVoteStatusData] = useState<
    VoteStatusPerMonthResponseModel[]
  >([]);
  const [upcomingVotes, setUpcomingVotes] = useState<
    VoteWithCreatorResponseModel[]
  >([]);
  const [ongoingVotes, setOngoingVotes] = useState<
    VoteWithCreatorResponseModel[]
  >([]);
  const [userStatistics, setUserStatistics] = useState<{
    total_users: number;
    nbr_admins: number;
    nbr_inscription_authority_admins: number;
    nbr_vote_authority_admins: number;
    active_users: number;
    inactive_users: number;
  } | null>(null);

  const [vote, setVote] = useState<FullVoteResponseModel | null>(null);

  const chartData = useMemo(() => {
    //console.log('vote', vote);
    const noSomthing = (something: string) => [
      {
        id: 'Nothing',
        name: 'Pas de ' + something,
        real_value: 0,
        value: 1,
        fill: '#60a5fa',
      },
    ];
    if (!vote) return noSomthing('Vote');
    if (vote.candidates.length === 0) {
      return noSomthing('Candidates');
    }
    const results = vote.candidates.map((candidate) => ({
      id: candidate.id,
      name: `${candidate.first_name} ${candidate.last_name}`,
      real_value: candidate.vote_count,
      value:
        candidate.vote_count && candidate.vote_count > 0
          ? candidate.vote_count
          : 1,
      fill: vote.vote?.winner_candidates?.includes(candidate.id as number)
        ? '#4ade80'
        : '#60a5fa',
    }));
    //console.log('results: ', results);
    return results;
  }, [vote]);

  const pieChartConfig = useMemo<ChartConfig>(() => {
    const config: ChartConfig = {
      value: {
        label: 'Votes',
      },
    };

    chartData.forEach((item) => {
      config[item.name] = {
        label: item.name,
        color: vote?.vote?.winner_candidates?.includes(item.id as number)
          ? '#4ade80'
          : '#60a5fa',
      };
    });

    return config;
  }, [chartData, vote]);

  const areaChartConfig: ChartConfig = {
    vote_count: {
      label: 'Votes',
      color: '#60a5fa',
    },
  };

  const userGrowthConfig: ChartConfig = {
    new_users_count: {
      label: 'Nouveaux utilisateurs',
      color: '#8b5cf6',
    },
    total_users: {
      label: 'Total utilisateurs',
      color: '#3b82f6',
    },
  };

  const participationConfig: ChartConfig = {
    count: {
      label: 'Participants',
    },
    Votants: {
      label: 'Votants',
      color: '#4ade80',
    },
    Abstentions: {
      label: 'Abstentions',
      color: '#fbbf24',
    },
    'Non votants': {
      label: 'Non votants',
      color: '#f87171',
    },
  };
  const userAdminRoleRepartitionChartConfig: ChartConfig = {
    Admins: {
      label: 'Admins',
      color: '#3b82f6',
    },
    'Vote Authority Admins': {
      label: 'Admins Autorité de Vote',
      color: '#10b981',
    },
    'Inscription Authority Admins': {
      label: "Admins Autorité d'Inscription",
      color: '#f59e0b',
    },
  };
  const userRoleRepartitionChartConfig: ChartConfig = {
    users: {
      label: 'Utilisateurs',
      color: '#3b82f6',
    },
    admins: {
      label: 'Admins',
      color: '#10b981',
    },
  };
  const userActivityRepartitionchartConfig: ChartConfig = {
    active: {
      label: 'Actifs',
      color: '#3b82f6',
    },
    inactive: {
      label: 'Inactifs',
      color: '#94a3b8',
    },
  };

  const voteStatusConfig: ChartConfig = {
    ongoing: {
      label: 'En cours',
      color: '#3b82f6',
    },
    finished: {
      label: 'Terminés',
      color: '#10b981',
    },
    upcoming: {
      label: 'Planifiés',
      color: '#f59e0b',
    },
  };

  const activeIndex = useMemo(() => {
    if (chartData.length === 0) return 0;
    const max = Math.max(...chartData.map((data) => data.value));
    return chartData.findIndex((data) => data.value === max);
  }, [chartData]);

  useEffect(() => {
    if (user?.authority === CurrentUserResponseModelAuthorityEnum.Vote) {
      setDisplay((_p) => ({
        ...get_AUTHORITY_DASHBOARD_SET_TO_FALSE(),
        ...VOTE_AUTHORITY_DASHBOARD,
      }));
      //console.log('Setting display to VOTE_AUTHORITY_DASHBOARD');
    } else if (
      user?.authority === CurrentUserResponseModelAuthorityEnum.Inscription
    ) {
      setDisplay((_p) => ({
        ...get_AUTHORITY_DASHBOARD_SET_TO_FALSE(),
        ...INSCRIPTION_AUTHORITY_DASHBOARD,
      }));
      //console.log('Setting display to INSCRIPTION_AUTHORITY_DASHBOARD');
    }
    //console.log('user: ', user);
    //console.log('display: ', display);
  }, [user]);

  useEffect(() => {
    apiClient()
      .admin.adminDashboard()
      .then((response) => {
        setVote(response.data.lastFinishedVote || null);
        setOngoingVotes(response.data.ongoingVotes || []);
        setUpcomingVotes(response.data.upcomingVotes || []);
        setParticipationData([
          {
            status: 'Votants',
            count: response.data.participationData?.total_votes ?? 0,
            fill: '#4ade80',
          },
          {
            status: 'Abstentions',
            count: response.data.participationData?.total_abstain ?? 0,
            fill: '#fbbf24',
          },
          {
            status: 'Non votants',
            count: response.data.participationData?.no_participation ?? 0,
            fill: '#f87171',
          },
        ]);
        setVotesPerMonthData(response.data.votesPerMonth || []);
        setUserGrowthData(response.data.userGrowthPerMonth || []);
        setVoteStatusData(response.data.votesStatusPerMonth || []);
        setUserStatistics({
          total_users: response.data.nbr_users ?? 0,
          nbr_inscription_authority_admins:
            response.data.nbr_inscription_authority ?? 0,
          nbr_vote_authority_admins: response.data.nbr_vote_authority ?? 0,
          nbr_admins: response.data.nbr_admins ?? 0,
          active_users: response.data.userActivityRepartition?.['active'] ?? 0,
          inactive_users:
            response.data.userActivityRepartition?.['inactive'] ?? 0,
        });
      })
      .catch((error) => {
        console.error('Error fetching admin dashboard data:', error);
        toast.error(
          'Erreur lors du chargement des données du tableau de bord administrateur.',
          { id: 'admin_dashboard_data_fetch_error' },
        );
      });
  }, []);

  return (
    <AppContainer admin>
      <div className='flex flex-col md:flex-row md:flex-wrap gap-8 justify-start'>
        {/* Last Finished vote dashboard section */}
        {display.lastFinishedVote && (
          <div className='mb-8 min-w-[480px] max-w-[580px] flex-1'>
            {vote ? (
              <Card className='p-6'>
                <CardTitle className='flex flex-row justify-between items-center'>
                  <p>{vote?.vote.vote.title}</p>
                  <VoteBadge type={getBadgeType(vote.vote.vote, true)} />
                </CardTitle>
                <CardContent>
                  <ChartContainer
                    className='mx-auto aspect-square w-full max-w-[300px]'
                    config={pieChartConfig}
                  >
                    <PieChart>
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Pie
                        data={chartData}
                        dataKey='value'
                        nameKey='name'
                        innerRadius={60}
                        strokeWidth={5}
                        activeIndex={activeIndex}
                        activeShape={({
                          outerRadius = 0,
                          ...props
                        }: PieSectorDataItem) => (
                          <g>
                            <Sector {...props} outerRadius={outerRadius + 5} />
                            <Sector {...props} innerRadius={outerRadius + 12} />
                          </g>
                        )}
                      >
                        <Label
                          content={({ viewBox }) => {
                            if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                              return (
                                <text
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  textAnchor='middle'
                                  dominantBaseline='middle'
                                >
                                  <tspan
                                    x={viewBox.cx}
                                    y={viewBox.cy}
                                    className='fill-foreground text-sm font-bold'
                                  >
                                    {chartData[activeIndex]?.real_value || 0}{' '}
                                    Votes
                                  </tspan>
                                  <tspan
                                    x={viewBox.cx}
                                    y={(viewBox.cy || 0) + 24}
                                    className='fill-muted-foreground text-xs'
                                  >
                                    {chartData[activeIndex]?.name || ''}
                                  </tspan>
                                </text>
                              );
                            }
                          }}
                        />
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            ) : (
              <Card className='p-6'>
                <CardTitle>No ongoing or recent votes</CardTitle>
              </Card>
            )}
          </div>
        )}

        {/* Number of votes per month chart */}
        {display.votesPerMonth && (
          <div className='mb-8 min-w-[480px] max-h-[500px] flex-1'>
            <Card className='p-6'>
              <CardTitle>Nombre de votes par mois</CardTitle>
              <CardContent>
                <ChartContainer
                  config={areaChartConfig}
                  className='aspect-auto h-[250px] w-full'
                >
                  <AreaChart data={votesPerMonthData}>
                    <defs>
                      <linearGradient
                        id='fillVotes'
                        x1='0'
                        y1='0'
                        x2='0'
                        y2='1'
                      >
                        <stop
                          offset='5%'
                          stopColor='#60a5fa'
                          stopOpacity={0.8}
                        />
                        <stop
                          offset='95%'
                          stopColor='#60a5fa'
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey='month'
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      minTickGap={32}
                      tickFormatter={(value) => {
                        //console.log('format xAxis value: ', value);

                        const date = new Date(value);
                        return date.toLocaleDateString('fr-FR', {
                          month: 'short',
                          year: 'numeric',
                        });
                      }}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          labelFormatter={(value) => {
                            return new Date(value).toLocaleDateString('fr-FR', {
                              month: 'long',
                              year: 'numeric',
                            });
                          }}
                          indicator='dot'
                        />
                      }
                    />
                    <Area
                      dataKey='vote_count'
                      type='natural'
                      fill='url(#fillVotes)'
                      stroke='#60a5fa'
                      strokeWidth={2}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Participation Rate Chart */}
        {display.participation && (
          <div className='mb-8 min-w-[480px] max-w-[580px] flex-1'>
            <Card className='p-6'>
              <CardTitle>Taux de participation</CardTitle>
              <CardContent>
                <ChartContainer
                  className='mx-auto aspect-square w-full max-w-[300px]'
                  config={participationConfig}
                >
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie
                      data={participationData}
                      dataKey='count'
                      nameKey='status'
                      innerRadius={60}
                      outerRadius={80}
                      strokeWidth={5}
                    >
                      <Label
                        content={({ viewBox }) => {
                          if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                            const total = participationData.reduce(
                              (acc, curr) => acc + curr.count,
                              0,
                            );
                            const percentage = (
                              (participationData[0].count / total) *
                              100
                            ).toFixed(1);
                            return (
                              <text
                                x={viewBox.cx}
                                y={viewBox.cy}
                                textAnchor='middle'
                                dominantBaseline='middle'
                              >
                                <tspan
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  className='fill-foreground text-2xl font-bold'
                                >
                                  {percentage}%
                                </tspan>
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy || 0) + 24}
                                  className='fill-muted-foreground text-xs'
                                >
                                  Participation
                                </tspan>
                              </text>
                            );
                          }
                        }}
                      />
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Vote Status Chart */}
        {display.voteStatus && (
          <div className='mb-8 min-w-[480px] max-w-[580px] flex-1'>
            <Card className='p-6'>
              <CardTitle>Statut des votes</CardTitle>
              <CardContent>
                <ChartContainer
                  config={voteStatusConfig}
                  className='aspect-auto h-[250px] w-full'
                >
                  <BarChart data={voteStatusData}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey='month'
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey='ongoing'
                      fill='#3b82f6'
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey='finished'
                      fill='#10b981'
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey='upcoming'
                      fill='#f59e0b'
                      radius={[4, 4, 0, 0]}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        )}
        {/* Upcoming Votes */}
        {display.upcomingVotes && (
          <div className='w-full min-w-[480px] max-w-[580px] flex-1'>
            <Card className='p-6'>
              <CardTitle className='mb-4'>Votes à venir</CardTitle>
              <CardContent className='space-y-4 p-0'>
                {upcomingVotes.map((voteItem) => (
                  <div
                    key={voteItem.id}
                    className='p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow'
                  >
                    <h4 className='font-semibold text-lg mb-2'>
                      {voteItem.title}
                    </h4>
                    <div className='space-y-2 text-sm text-muted-foreground'>
                      <div className='flex items-center gap-2'>
                        <Calendar className='w-4 h-4' />
                        <span>
                          Début:{' '}
                          {new Date(voteItem.start_date).toLocaleDateString(
                            'fr-FR',
                            {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            },
                          )}
                        </span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Clock className='w-4 h-4' />
                        <span>
                          Fin:{' '}
                          {new Date(voteItem.end_date).toLocaleDateString(
                            'fr-FR',
                            {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            },
                          )}
                        </span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <User className='w-4 h-4' />
                        <span>
                          Créé par: {voteItem.creator.first_name}{' '}
                          {voteItem.creator.last_name}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Ongoing Votes */}
        {display.ongoingVotes && (
          <div className='w-full min-w-[480px] max-w-[580px] flex-1'>
            <Card className='p-6'>
              <CardTitle className='mb-4'>Votes en cours</CardTitle>
              <CardContent className='space-y-4 p-0'>
                {ongoingVotes.map((voteItem) => (
                  <div
                    key={voteItem.id}
                    className='p-4 border border-blue-200 bg-blue-50/50 rounded-lg hover:shadow-md transition-shadow'
                  >
                    <h4 className='font-semibold text-lg mb-2'>
                      {voteItem.title}
                    </h4>
                    <div className='space-y-2 text-sm text-muted-foreground'>
                      <div className='flex items-center gap-2'>
                        <Calendar className='w-4 h-4' />
                        <span>
                          Début:{' '}
                          {new Date(voteItem.start_date).toLocaleDateString(
                            'fr-FR',
                            {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            },
                          )}
                        </span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Clock className='w-4 h-4' />
                        <span>
                          Fin:{' '}
                          {new Date(voteItem.end_date).toLocaleDateString(
                            'fr-FR',
                            {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            },
                          )}
                        </span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <User className='w-4 h-4' />
                        <span>
                          Créé par: {voteItem.creator.first_name}{' '}
                          {voteItem.creator.last_name}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Inscription Authority Dashboard */}
        {display.userActivityRepartition && (
          <div className='mb-8 min-w-[480px] max-w-[580px] flex-1'>
            <Card className='flex flex-col'>
              <CardHeader className='items-center pb-0'>
                <CardTitle>Etats Des Utilisateurs</CardTitle>
                <CardDescription>
                  Répartition des utilisateurs actifs et inactifs sur la
                  plateforme.
                </CardDescription>
              </CardHeader>
              <CardContent className='flex flex-1 items-center pb-0'>
                <ChartContainer
                  config={userActivityRepartitionchartConfig}
                  className='mx-auto aspect-square w-full max-w-[250px]'
                >
                  <RadialBarChart
                    data={[
                      {
                        name: 'Actifs',
                        active_users: userStatistics?.active_users ?? 0,
                      },
                      {
                        name: 'Inactifs',
                        inactive_users: userStatistics?.inactive_users ?? 0,
                      },
                    ]}
                    endAngle={180}
                    innerRadius={80}
                    outerRadius={130}
                  >
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <PolarRadiusAxis
                      tick={false}
                      tickLine={false}
                      axisLine={false}
                    >
                      <Label
                        content={({ viewBox }) => {
                          if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                            return (
                              <text
                                x={viewBox.cx}
                                y={viewBox.cy}
                                textAnchor='middle'
                              >
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy || 0) - 16}
                                  className='fill-foreground text-2xl font-bold'
                                >
                                  {userStatistics?.active_users.toLocaleString() ??
                                    0}
                                </tspan>
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy || 0) + 4}
                                  className='fill-muted-foreground'
                                >
                                  Actifs
                                </tspan>
                              </text>
                            );
                          }
                        }}
                      />
                    </PolarRadiusAxis>
                    <RadialBar
                      dataKey='inactive_users'
                      fill='#94a3b8'
                      stackId='a'
                      cornerRadius={5}
                      className='stroke-transparent stroke-2'
                    />
                    <RadialBar
                      dataKey='active_users'
                      stackId='a'
                      cornerRadius={5}
                      fill='#3b82f6'
                      className='stroke-transparent stroke-2'
                    />
                  </RadialBarChart>
                </ChartContainer>
              </CardContent>
              <CardFooter className='flex-col gap-2 text-sm'>
                <div className='leading-none text-muted-foreground'>
                  Inactifs :{' '}
                  {userStatistics?.inactive_users.toLocaleString() ?? 0}
                </div>
              </CardFooter>
            </Card>
          </div>
        )}
        {/* User Growth Chart */}
        {display.userGrowth && (
          <div className='mb-8 min-w-[480px] max-w-[580px] flex-1'>
            <Card className='p-6'>
              <CardTitle>Croissance des utilisateurs</CardTitle>
              <CardContent>
                <ChartContainer
                  config={userGrowthConfig}
                  className='aspect-auto h-[250px] w-full'
                >
                  <LineChart data={userGrowthData}>
                    <CartesianGrid vertical={false} strokeDasharray='3 3' />
                    <XAxis
                      dataKey='month'
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      minTickGap={32}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString('fr-FR', {
                          month: 'short',
                          year: 'numeric',
                        });
                      }}
                    />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(value) => {
                            return new Date(value).toLocaleDateString('fr-FR', {
                              month: 'long',
                              year: 'numeric',
                            });
                          }}
                        />
                      }
                    />
                    <Line
                      dataKey='new_users_count'
                      type='monotone'
                      stroke='#8b5cf6'
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      dataKey='total_users'
                      type='monotone'
                      stroke='#3b82f6'
                      strokeWidth={2}
                      dot={false}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        )}
        {/* userAdminRole repartition */}
        {display.userRoleRepartition && (
          <div className='mb-8 min-w-[480px] max-w-[580px] flex-1'>
            <Card className='flex flex-col'>
              <CardHeader className='items-center pb-0'>
                <CardTitle>Répartition des rôles d'administrateurs</CardTitle>
                <CardDescription>
                  Répartition des administrateurs entre les différentes
                  autorités (vote et inscription).
                </CardDescription>
              </CardHeader>
              <CardContent className='flex-1 pb-0'>
                <ChartContainer
                  config={userAdminRoleRepartitionChartConfig}
                  className='mx-auto aspect-square max-h-[250px]'
                >
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie
                      data={[
                        {
                          name: 'Admins Autorité de Vote',
                          count: userStatistics?.nbr_vote_authority_admins ?? 0,
                          fill: '#10b981',
                        },
                        {
                          name: "Admins Autorité d'Inscription",
                          count:
                            userStatistics?.nbr_inscription_authority_admins ??
                            0,
                          fill: '#3b82f6',
                        },
                      ]}
                      dataKey='count'
                      nameKey='name'
                      innerRadius={60}
                      strokeWidth={5}
                    >
                      <Label
                        content={({ viewBox }) => {
                          if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                            return (
                              <text
                                x={viewBox.cx}
                                y={viewBox.cy}
                                textAnchor='middle'
                                dominantBaseline='middle'
                              >
                                <tspan
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  className='fill-foreground text-3xl font-bold'
                                >
                                  {userStatistics?.nbr_admins.toLocaleString()}
                                </tspan>
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy || 0) + 24}
                                  className='fill-muted-foreground'
                                >
                                  Admins
                                </tspan>
                              </text>
                            );
                          }
                        }}
                      />
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </CardContent>
              <CardFooter className='flex-col gap-2 text-sm'>
                <div className='leading-none text-muted-foreground'>
                  Total Admins: {userStatistics?.nbr_admins.toLocaleString()}
                </div>
                <div className='flex flex-row items-center gap-2'>
                  <div className='w-3 h-3 rounded-full bg-green-500' />
                  <span>
                    Admins d'Autorité de Vote:{' '}
                    {userStatistics?.nbr_vote_authority_admins.toLocaleString()}
                  </span>
                </div>
                <div className='flex flex-row items-center gap-2'>
                  <div className='w-3 h-3 rounded-full bg-blue-500' />
                  <span>
                    Admins d'Autorité d'Inscription:{' '}
                    {userStatistics?.nbr_inscription_authority_admins.toLocaleString()}
                  </span>
                </div>
              </CardFooter>
            </Card>
          </div>
        )}
        {/* user role repartition */}
        {display.userRoleRepartition && (
          <div className='mb-8 min-w-[480px] max-w-[580px] flex-1'>
            <Card>
              <CardHeader>
                <CardTitle>Repartition des Utilisateurs</CardTitle>
                <CardDescription>
                  Répartition des utilisateurs entre les utilisateurs normaux et
                  les administrateurs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={userRoleRepartitionChartConfig}>
                  <BarChart
                    accessibilityLayer
                    data={[
                      {
                        name: 'Admins',
                        total: userStatistics?.nbr_admins ?? 0,
                        fill: '#3b82f6',
                      },
                      {
                        name: 'Utilisateurs',
                        total: userStatistics?.total_users ?? 0,
                        fill: '#10b981',
                      },
                    ]}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey='name'
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator='dashed' />}
                    />
                    <Bar dataKey='total' radius={4} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
              <CardFooter className='flex-col items-center gap-2 text-sm'>
                <div className='leading-none text-muted-foreground'>
                  Total:{' '}
                  {(userStatistics?.total_users ?? 0) +
                    (userStatistics?.nbr_admins ?? 0)}{' '}
                </div>
                <div className='flex flex-row items-center gap-2'>
                  <div className='w-3 h-3 rounded-full bg-blue-500' />
                  <span>
                    Utilisateurs:{' '}
                    {userStatistics
                      ? (
                          userStatistics.total_users - userStatistics.nbr_admins
                        ).toLocaleString()
                      : 0}
                  </span>
                </div>
                <div className='flex flex-row items-center gap-2'>
                  <div className='w-3 h-3 rounded-full bg-green-500' />
                  <span>
                    Admins: {userStatistics?.nbr_admins.toLocaleString() ?? 0}
                  </span>
                </div>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </AppContainer>
  );
};

export default AdminPage;
