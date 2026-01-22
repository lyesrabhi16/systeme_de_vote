import apiClient from '@/api/client';
import {
  type VoteStatusPerMonthResponseModel,
  type FullVoteResponseModel,
  type UserGrowthPerMonthResponseModel,
  type VotesPerMonthResponseModel,
  type VoteWithCreatorResponseModel,
} from '@/api/sdk/api';
import VoteBadge from '@/components/home/VoteBadge';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import AppContainer from '@/components/utils/AppContainer';
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
  Sector,
  XAxis,
  YAxis,
} from 'recharts';
import type { PieSectorDataItem } from 'recharts/types/polar/Pie';
import { toast } from 'sonner';

const AdminPage = () => {
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

  const [vote, setVote] = useState<FullVoteResponseModel | null>(null);

  const chartData = useMemo(() => {
    console.log('vote', vote);
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
    console.log('results: ', results);
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
    apiClient()
      .admin.adminDashboard()
      .then((response) => {
        setVote(response.data.lastFinishedVote || null);
        setOngoingVotes(response.data.ongoingVotes || []);
        setUpcomingVotes(response.data.upcomingVotes || []);
        setParticipationData([
          {
            status: 'Votants',
            count: response.data.participationData.total_votes,
            fill: '#4ade80',
          },
          {
            status: 'Abstentions',
            count: response.data.participationData.total_abstain,
            fill: '#fbbf24',
          },
          {
            status: 'Non votants',
            count: response.data.participationData.no_participation,
            fill: '#f87171',
          },
        ]);
        setVotesPerMonthData(response.data.votesPerMonth || []);
        setUserGrowthData(response.data.userGrowthPerMonth);
        setVoteStatusData(response.data.votesStatusPerMonth || []);
      })
      .catch((error) => {
        console.error('Error fetching admin dashboard data:', error);
        toast.error(
          'Erreur lors du chargement des données du tableau de bord administrateur.',
        );
      });
  }, []);
  return (
    <AppContainer admin>
      <div className='flex flex-col md:flex-row md:flex-wrap gap-8 justify-start'>
        {/* Last Finished vote dashboard section */}
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

        {/* Number of votes per month chart */}
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
                    <linearGradient id='fillVotes' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor='#60a5fa' stopOpacity={0.8} />
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
                      console.log('format xAxis value: ', value);

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

        {/* User Growth Chart */}
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

        {/* Participation Rate Chart */}
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

        {/* Vote Status Chart */}
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
                  <Bar dataKey='ongoing' fill='#3b82f6' radius={[4, 4, 0, 0]} />
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

        {/* Upcoming Votes */}
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

        {/* Ongoing Votes */}
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
      </div>
    </AppContainer>
  );
};

export default AdminPage;
