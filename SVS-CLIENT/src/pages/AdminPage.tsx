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

// ─── Dashboard display flags ────────────────────────────────────────────────

type DashboardDisplay = {
  votesPerMonth: boolean;
  voteStatus: boolean;
  participation: boolean;
  lastFinishedVote: boolean;
  upcomingVotes: boolean;
  ongoingVotes: boolean;
  userGrowth: boolean;
  userRoleRepartition: boolean;
  userActivityRepartition: boolean;
  userStatistics: boolean;
};

const VOTE_AUTHORITY_DISPLAY: DashboardDisplay = {
  votesPerMonth: true,
  voteStatus: true,
  participation: true,
  lastFinishedVote: true,
  upcomingVotes: true,
  ongoingVotes: true,
  userGrowth: false,
  userRoleRepartition: false,
  userActivityRepartition: false,
  userStatistics: false,
};

const INSCRIPTION_AUTHORITY_DISPLAY: DashboardDisplay = {
  votesPerMonth: false,
  voteStatus: false,
  participation: false,
  lastFinishedVote: false,
  upcomingVotes: false,
  ongoingVotes: false,
  userGrowth: true,
  userRoleRepartition: true,
  userActivityRepartition: true,
  userStatistics: true,
};

const ALL_HIDDEN_DISPLAY: DashboardDisplay = {
  votesPerMonth: false,
  voteStatus: false,
  participation: false,
  lastFinishedVote: false,
  upcomingVotes: false,
  ongoingVotes: false,
  userGrowth: false,
  userRoleRepartition: false,
  userActivityRepartition: false,
  userStatistics: false,
};

// ─── User statistics type ────────────────────────────────────────────────────

type UserStatistics = {
  total_users: number;
  nbr_admins: number;
  nbr_inscription_authority_admins: number;
  nbr_vote_authority_admins: number;
  active_users: number;
  inactive_users: number;
};

// ─── Chart configs (stable references, defined outside component) ─────────────

const areaChartConfig: ChartConfig = {
  vote_count: { label: 'Votes', color: '#60a5fa' },
};

const userGrowthConfig: ChartConfig = {
  new_users_count: { label: 'Nouveaux utilisateurs', color: '#8b5cf6' },
  total_users: { label: 'Total utilisateurs', color: '#3b82f6' },
};

const participationConfig: ChartConfig = {
  count: { label: 'Participants' },
  Votants: { label: 'Votants', color: '#4ade80' },
  Abstentions: { label: 'Abstentions', color: '#fbbf24' },
  'Non votants': { label: 'Non votants', color: '#f87171' },
};

const userAdminRoleRepartitionConfig: ChartConfig = {
  'Vote Authority Admins': {
    label: 'Admins Autorité de Vote',
    color: '#10b981',
  },
  'Inscription Authority Admins': {
    label: "Admins Autorité d'Inscription",
    color: '#f59e0b',
  },
};

const userRoleRepartitionConfig: ChartConfig = {
  users: { label: 'Utilisateurs', color: '#3b82f6' },
  admins: { label: 'Admins', color: '#10b981' },
};

const userActivityConfig: ChartConfig = {
  active: { label: 'Actifs', color: '#3b82f6' },
  inactive: { label: 'Inactifs', color: '#94a3b8' },
};

const voteStatusConfig: ChartConfig = {
  ongoing: { label: 'En cours', color: '#3b82f6' },
  finished: { label: 'Terminés', color: '#10b981' },
  upcoming: { label: 'Planifiés', color: '#f59e0b' },
};

// ─── Component ───────────────────────────────────────────────────────────────

const AdminPage = () => {
  const { user } = useGlobalStore();

  const [display, setDisplay] = useState<DashboardDisplay>(ALL_HIDDEN_DISPLAY);

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
  const [userStatistics, setUserStatistics] = useState<UserStatistics | null>(
    null,
  );
  const [vote, setVote] = useState<FullVoteResponseModel | null>(null);

  // ── Derived chart data ──────────────────────────────────────────────────────

  const chartData = useMemo(() => {
    const nothing = (label: string) => [
      {
        id: -1,
        name: `Pas de ${label}`,
        real_value: 0,
        value: 1,
        fill: '#60a5fa',
      },
    ];
    if (!vote) return nothing('vote');
    if (vote.candidates.length === 0) return nothing('candidats');

    return vote.candidates.map((candidate) => ({
      id: candidate.id ?? -1,
      name: `${candidate.first_name ?? ''} ${candidate.last_name ?? ''}`.trim(),
      real_value: candidate.vote_count ?? 0,
      value:
        (candidate.vote_count ?? 0) > 0 ? (candidate.vote_count as number) : 1,
      fill: vote.vote?.winner_candidates?.includes(candidate.id as number)
        ? '#4ade80'
        : '#60a5fa',
    }));
  }, [vote]);

  const pieChartConfig = useMemo<ChartConfig>(() => {
    const config: ChartConfig = { value: { label: 'Votes' } };
    chartData.forEach((item) => {
      config[item.name] = {
        label: item.name,
        color: vote?.vote?.winner_candidates?.includes(item.id)
          ? '#4ade80'
          : '#60a5fa',
      };
    });
    return config;
  }, [chartData, vote]);

  const activeIndex = useMemo(() => {
    if (chartData.length === 0) return 0;
    const max = Math.max(...chartData.map((d) => d.value));
    return chartData.findIndex((d) => d.value === max);
  }, [chartData]);

  // ── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (user?.authority === CurrentUserResponseModelAuthorityEnum.Vote) {
      setDisplay({ ...ALL_HIDDEN_DISPLAY, ...VOTE_AUTHORITY_DISPLAY });
    } else if (
      user?.authority === CurrentUserResponseModelAuthorityEnum.Inscription
    ) {
      setDisplay({ ...ALL_HIDDEN_DISPLAY, ...INSCRIPTION_AUTHORITY_DISPLAY });
    }
  }, [user]);

  useEffect(() => {
    apiClient()
      .admin.adminDashboard()
      .then((response) => {
        const d = response.data;
        setVote(d.lastFinishedVote ?? null);
        setOngoingVotes(d.ongoingVotes ?? []);
        setUpcomingVotes(d.upcomingVotes ?? []);
        setParticipationData([
          {
            status: 'Votants',
            count: d.participationData?.total_votes ?? 0,
            fill: '#4ade80',
          },
          {
            status: 'Abstentions',
            count: d.participationData?.total_abstain ?? 0,
            fill: '#fbbf24',
          },
          {
            status: 'Non votants',
            count: d.participationData?.no_participation ?? 0,
            fill: '#f87171',
          },
        ]);
        setVotesPerMonthData(d.votesPerMonth ?? []);
        setUserGrowthData(d.userGrowthPerMonth ?? []);
        setVoteStatusData(d.votesStatusPerMonth ?? []);
        setUserStatistics({
          total_users: d.nbr_users ?? 0,
          nbr_admins: d.nbr_admins ?? 0,
          nbr_inscription_authority_admins: d.nbr_inscription_authority ?? 0,
          nbr_vote_authority_admins: d.nbr_vote_authority ?? 0,
          active_users: d.userActivityRepartition?.['active'] ?? 0,
          inactive_users: d.userActivityRepartition?.['inactive'] ?? 0,
        });
      })
      .catch((error) => {
        console.error('Error fetching admin dashboard data:', error);
        toast.error(
          'Erreur lors du chargement des données du tableau de bord.',
          {
            id: 'admin_dashboard_data_fetch_error',
          },
        );
      });
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const formatMonthFr = (value: string) =>
    new Date(value).toLocaleDateString('fr-FR', {
      month: 'short',
      year: 'numeric',
    });

  const formatMonthLongFr = (value: string) =>
    new Date(value).toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric',
    });

  const formatDateTimeFr = (value: string) =>
    new Date(value).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <AppContainer admin>
      <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-auto'>
        {/* ── Last finished vote ── */}
        {display.lastFinishedVote && (
          <Card className='p-6 col-span-1'>
            {vote ? (
              <>
                <CardTitle className='flex flex-row justify-between items-center gap-2 flex-wrap'>
                  <p className='truncate'>{vote.vote.vote.title}</p>
                  <VoteBadge type={getBadgeType(vote.vote.vote, true)} />
                </CardTitle>
                <CardContent className='p-0 mt-4'>
                  <ChartContainer
                    className='mx-auto aspect-square w-full max-w-[280px]'
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
                                    {chartData[activeIndex]?.real_value ?? 0}{' '}
                                    Votes
                                  </tspan>
                                  <tspan
                                    x={viewBox.cx}
                                    y={(viewBox.cy ?? 0) + 24}
                                    className='fill-muted-foreground text-xs'
                                  >
                                    {chartData[activeIndex]?.name ?? ''}
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
              </>
            ) : (
              <CardTitle>Aucun vote récent</CardTitle>
            )}
          </Card>
        )}

        {/* ── Votes per month ── */}
        {display.votesPerMonth && (
          <Card className='p-6 col-span-1 md:col-span-2 xl:col-span-2'>
            <CardTitle>Nombre de votes par mois</CardTitle>
            <CardContent className='p-0 mt-4'>
              <ChartContainer
                config={areaChartConfig}
                className='h-[250px] w-full'
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
                    tickFormatter={formatMonthFr}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        labelFormatter={formatMonthLongFr}
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
        )}

        {/* ── Participation rate ── */}
        {display.participation && (
          <Card className='p-6 col-span-1'>
            <CardTitle>Taux de participation</CardTitle>
            <CardContent className='p-0 mt-4'>
              <ChartContainer
                className='mx-auto aspect-square w-full max-w-[280px]'
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
                            (acc, cur) => acc + cur.count,
                            0,
                          );
                          const pct =
                            total > 0
                              ? (
                                  (participationData[0].count / total) *
                                  100
                                ).toFixed(1)
                              : '0.0';
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
                                {pct}%
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy ?? 0) + 24}
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
        )}

        {/* ── Vote status chart ── */}
        {display.voteStatus && (
          <Card className='p-6 col-span-1 md:col-span-2'>
            <CardTitle>Statut des votes</CardTitle>
            <CardContent className='p-0 mt-4'>
              <ChartContainer
                config={voteStatusConfig}
                className='h-[250px] w-full'
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
        )}

        {/* ── Upcoming votes ── */}
        {display.upcomingVotes && (
          <Card className='p-6 col-span-1'>
            <CardTitle className='mb-4'>Votes à venir</CardTitle>
            <CardContent className='space-y-3 p-0'>
              {upcomingVotes.length === 0 ? (
                <p className='text-sm text-muted-foreground'>
                  Aucun vote à venir.
                </p>
              ) : (
                upcomingVotes.map((voteItem) => (
                  <div
                    key={voteItem.id}
                    className='p-4 border rounded-lg hover:shadow-md transition-shadow'
                  >
                    <h4 className='font-semibold text-base mb-2 line-clamp-1'>
                      {voteItem.title}
                    </h4>
                    <div className='space-y-1.5 text-sm text-muted-foreground'>
                      <div className='flex items-center gap-2'>
                        <Calendar className='w-4 h-4 shrink-0' />
                        <span>
                          Début : {formatDateTimeFr(voteItem.start_date)}
                        </span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Clock className='w-4 h-4 shrink-0' />
                        <span>Fin : {formatDateTimeFr(voteItem.end_date)}</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <User className='w-4 h-4 shrink-0' />
                        <span>
                          Créé par : {voteItem.creator.first_name}{' '}
                          {voteItem.creator.last_name}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Ongoing votes ── */}
        {display.ongoingVotes && (
          <Card className='p-6 col-span-1'>
            <CardTitle className='mb-4'>Votes en cours</CardTitle>
            <CardContent className='space-y-3 p-0'>
              {ongoingVotes.length === 0 ? (
                <p className='text-sm text-muted-foreground'>
                  Aucun vote en cours.
                </p>
              ) : (
                ongoingVotes.map((voteItem) => (
                  <div
                    key={voteItem.id}
                    className='p-4 border border-blue-200 bg-blue-50/50 rounded-lg hover:shadow-md transition-shadow'
                  >
                    <h4 className='font-semibold text-base mb-2 line-clamp-1'>
                      {voteItem.title}
                    </h4>
                    <div className='space-y-1.5 text-sm text-muted-foreground'>
                      <div className='flex items-center gap-2'>
                        <Calendar className='w-4 h-4 shrink-0' />
                        <span>
                          Début : {formatDateTimeFr(voteItem.start_date)}
                        </span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Clock className='w-4 h-4 shrink-0' />
                        <span>Fin : {formatDateTimeFr(voteItem.end_date)}</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <User className='w-4 h-4 shrink-0' />
                        <span>
                          Créé par : {voteItem.creator.first_name}{' '}
                          {voteItem.creator.last_name}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* ── User activity repartition ── */}
        {display.userActivityRepartition && (
          <Card className='col-span-1 flex flex-col'>
            <CardHeader className='items-center pb-0'>
              <CardTitle>État des utilisateurs</CardTitle>
              <CardDescription>
                Répartition des utilisateurs actifs et inactifs.
              </CardDescription>
            </CardHeader>
            <CardContent className='flex flex-1 items-center pb-0'>
              <ChartContainer
                config={userActivityConfig}
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
                                y={(viewBox.cy ?? 0) - 16}
                                className='fill-foreground text-2xl font-bold'
                              >
                                {(
                                  userStatistics?.active_users ?? 0
                                ).toLocaleString()}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy ?? 0) + 4}
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
            <CardFooter className='flex-col gap-1 text-sm'>
              <div className='leading-none text-muted-foreground'>
                Inactifs :{' '}
                {(userStatistics?.inactive_users ?? 0).toLocaleString()}
              </div>
            </CardFooter>
          </Card>
        )}

        {/* ── User growth ── */}
        {display.userGrowth && (
          <Card className='p-6 col-span-1 md:col-span-2'>
            <CardTitle>Croissance des utilisateurs</CardTitle>
            <CardContent className='p-0 mt-4'>
              <ChartContainer
                config={userGrowthConfig}
                className='h-[250px] w-full'
              >
                <LineChart data={userGrowthData}>
                  <CartesianGrid vertical={false} strokeDasharray='3 3' />
                  <XAxis
                    dataKey='month'
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tickFormatter={formatMonthFr}
                  />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent labelFormatter={formatMonthLongFr} />
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
        )}

        {/* ── Admin role repartition (pie) ── */}
        {display.userRoleRepartition && (
          <Card className='col-span-1 flex flex-col'>
            <CardHeader className='items-center pb-0'>
              <CardTitle>Répartition des rôles d'administrateurs</CardTitle>
              <CardDescription>
                Répartition entre autorités vote et inscription.
              </CardDescription>
            </CardHeader>
            <CardContent className='flex-1 pb-0'>
              <ChartContainer
                config={userAdminRoleRepartitionConfig}
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
                          userStatistics?.nbr_inscription_authority_admins ?? 0,
                        fill: '#f59e0b',
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
                                {(
                                  userStatistics?.nbr_admins ?? 0
                                ).toLocaleString()}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy ?? 0) + 24}
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
                Total admins :{' '}
                {(userStatistics?.nbr_admins ?? 0).toLocaleString()}
              </div>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-3 rounded-full bg-green-500 shrink-0' />
                <span>
                  Autorité de Vote :{' '}
                  {(
                    userStatistics?.nbr_vote_authority_admins ?? 0
                  ).toLocaleString()}
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-3 rounded-full bg-amber-500 shrink-0' />
                <span>
                  Autorité d'Inscription :{' '}
                  {(
                    userStatistics?.nbr_inscription_authority_admins ?? 0
                  ).toLocaleString()}
                </span>
              </div>
            </CardFooter>
          </Card>
        )}

        {/* ── User vs admin repartition (bar) ── */}
        {display.userRoleRepartition && (
          <Card className='col-span-1 md:col-span-2 xl:col-span-1'>
            <CardHeader>
              <CardTitle>Répartition des utilisateurs</CardTitle>
              <CardDescription>
                Utilisateurs normaux vs administrateurs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={userRoleRepartitionConfig}
                className='h-[220px] w-full'
              >
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
                Total :{' '}
                {(
                  (userStatistics?.total_users ?? 0) +
                  (userStatistics?.nbr_admins ?? 0)
                ).toLocaleString()}
              </div>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-3 rounded-full bg-green-500 shrink-0' />
                <span>
                  Utilisateurs :{' '}
                  {userStatistics
                    ? (
                        userStatistics.total_users - userStatistics.nbr_admins
                      ).toLocaleString()
                    : 0}
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-3 rounded-full bg-blue-500 shrink-0' />
                <span>
                  Admins : {(userStatistics?.nbr_admins ?? 0).toLocaleString()}
                </span>
              </div>
            </CardFooter>
          </Card>
        )}
      </div>
    </AppContainer>
  );
};

export default AdminPage;
