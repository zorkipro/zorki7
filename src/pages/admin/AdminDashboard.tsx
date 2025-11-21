import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminBloggers } from "@/hooks/admin/useAdminBloggers";
import { useAdminBloggerActions } from "@/hooks/admin/useAdminBloggerActions";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Button } from "@/ui-kit";
import { Input } from "@/ui-kit";
import { Checkbox } from "@/ui-kit";
import { Star, LogOut, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/ui-kit/components";
import { StatsCards } from "@/components/admin/StatsCards";
import { AdminLinkRequestsTable } from "@/components/admin/AdminLinkRequestsTable";
import { BloggersTable } from "@/components/admin/BloggersTable";
import { GenderSelectionTable } from "@/components/admin/GenderSelectionTable";
import { AddBloggerDialog } from "@/components/admin/AddBloggerDialog";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { TopicsManagementDialog } from "@/components/admin/TopicsManagementDialog";
import { formatNumber } from "@/utils/formatters";
import { logError } from "@/utils/logger";
import { adminToggleBloggerVisibility } from "@/api/endpoints/admin";
import { mapLinkRequestToTableFormat } from "@/utils/admin/mappers";
import type { AdminGetLinkBloggerClientRequestOutputDto } from "@/api/types";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { adminInfo, loading: adminLoading } = useAdminAuth();

  const [activeTab, setActiveTab] = useState("bloggers");
  const [topicsDialogOpen, setTopicsDialogOpen] = useState(false);

  const {
    allBloggers,
    bloggersWithoutGender,
    linkRequests,
    loading,
    searchLoading,
    isLoadingMore,
    hasMoreBloggers,
    totalBloggersCount,
    stats,
    searchTerm,
    setSearchTerm,
    showHidden,
    setShowHidden,
    refetchBloggers,
    loadMoreBloggers,
    approveRequest,
    rejectRequest,
    updateBloggerVisibility,
    updateBloggerGenderLocally,
    loadMoreGenderBloggers,
    loadingGenderBloggers,
    hasMoreGenderBloggers,
    totalGenderBloggersCount,
    clearGenderCache,
    isProcessing,
    error,
  } = useAdminBloggers(activeTab);

  const { addBlogger, toggleVisibility } = useAdminBloggerActions();

  const filteredBloggers = allBloggers;

  const filteredLinkRequests = useMemo(() => {
    let result = linkRequests.map(mapLinkRequestToTableFormat);

    if (searchTerm) {
      result = result.filter((request) => {
        const bloggerName = `${request.name} ${request.lastName}`.trim() || "";
        const username = request.username || "";
        const userEmail = request.user_email || "";

        return (
            bloggerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            userEmail.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    return result;
  }, [linkRequests, searchTerm]);

  if (loading || adminLoading) {
    return <LoadingSpinner fullScreen text="Загрузка..." />;
  }

  return (
      <div className="min-h-screen bg-gradient-subtle">
        <AdminHeader onOpenTopicsManagement={() => setTopicsDialogOpen(true)} />
        <div className="container mx-auto px-4 py-6">
          <StatsCards stats={stats} />
          <div className="space-y-4 mb-6">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Поиск по имени или username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
              </div>

              {activeTab === "bloggers" && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                        id="show-hidden"
                        checked={showHidden}
                        onCheckedChange={(checked) => setShowHidden(!!checked)}
                    />
                    <label
                        htmlFor="show-hidden"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Показывать скрытых
                    </label>
                  </div>
              )}
            </div>

            <div className="flex gap-2 items-center justify-between">
              <div className="flex gap-2">
                <Button
                    variant={activeTab === "bloggers" ? "default" : "outline"}
                    onClick={() => setActiveTab("bloggers")}
                    size="sm"
                >
                  Все блогеры
                </Button>
                <Button
                    variant={activeTab === "gender-selection" ? "default" : "outline"}
                    onClick={() => setActiveTab("gender-selection")}
                    size="sm"
                >
                  Выбор пола
                </Button>
                <Button
                    variant={activeTab === "link-requests" ? "default" : "outline"}
                    onClick={() => setActiveTab("link-requests")}
                    size="sm"
                >
                  Запросы
                </Button>
              </div>

              {/* Add Blogger Button - только на вкладке блогеров */}
              {activeTab === "bloggers" && (
                  <AddBloggerDialog onAddBlogger={async (username) => {
                    await addBlogger.mutateAsync(username);
                  }} />
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              {activeTab === "link-requests"
                  ? "Показаны запросы на связывание блогеров с клиентами. При одобрении запроса блогер автоматически становится верифицированным."
                  : activeTab === "gender-selection"
                      ? "Быстрый выбор пола для блогеров без указанного пола. Нажмите на кнопку с нужным полом для обновления."
                      : ""}
            </div>
          </div>


          {activeTab === "bloggers" ? (
              <BloggersTable
                  bloggers={filteredBloggers}
                  onToggleVisibility={(id) => toggleVisibility.mutate({ id })}
                  formatNumber={formatNumber}
                  searchLoading={searchLoading}
                  isLoadingMore={isLoadingMore}
                  hasMore={hasMoreBloggers}
                  onLoadMore={loadMoreBloggers}
                  totalCount={
                    searchTerm ? filteredBloggers.length : totalBloggersCount
                  }
              />
          ) : activeTab === "gender-selection" ? (
              <GenderSelectionTable
                  bloggers={bloggersWithoutGender}
                  onBloggerGenderUpdated={updateBloggerGenderLocally}
                  loading={loadingGenderBloggers}
                  hasMore={hasMoreGenderBloggers}
                  onLoadMore={loadMoreGenderBloggers}
                  totalCount={totalGenderBloggersCount}
                  onClearCache={clearGenderCache}
              />
          ) : (
              <AdminLinkRequestsTable
                  requests={filteredLinkRequests}
                  loading={loading}
                  isProcessing={isProcessing}
                  onApprove={approveRequest}
                  onReject={rejectRequest}
              />
          )}
        </div>

        <TopicsManagementDialog
            open={topicsDialogOpen}
            onOpenChange={setTopicsDialogOpen}
        />
      </div>
  );
};

export default AdminDashboard;

//main
//import { useState, useEffect } from "react";
// import { useAdminBloggers } from "@/hooks/admin/useAdminBloggers";
// import { useAdminBloggerActions } from "@/hooks/admin/useAdminBloggerActions";
// import { useAdminAuth } from "@/contexts/AdminAuthContext";
// import { Button } from "@/ui-kit";
// import { Input } from "@/ui-kit";
// import { Checkbox } from "@/ui-kit";
// import { Search } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";
// import { LoadingSpinner } from "@/ui-kit/components";
// import { StatsCards } from "@/components/admin/StatsCards";
// import { AdminLinkRequestsTable } from "@/components/admin/AdminLinkRequestsTable";
// import { BloggersTable } from "@/components/admin/BloggersTable";
// import { GenderSelectionTable } from "@/components/admin/GenderSelectionTable";
// import { AddBloggerDialog } from "@/components/admin/AddBloggerDialog";
// import { AdminHeader } from "@/components/admin/AdminHeader";
// import { formatNumber } from "@/utils/formatters";
// import { adminToggleBloggerVisibility } from "@/api/endpoints/admin";
//
// const TAB_CONFIG = {
//   bloggers: { label: "Все блогеры", desc: "" },
//   "gender-selection": { label: "Выбор пола", desc: "Быстрый выбор пола для блогеров без указанного пола. Нажмите на кнопку с нужным полом для обновления." },
//   "link-requests": { label: "Запросы", desc: "Показаны запросы на связывание блогеров с клиентами. При одобрении запроса блогер автоматически становится верифицированным." },
// } as const;
//
// const AdminDashboard = () => {
//   const { toast } = useToast();
//   const { loading: adminLoading } = useAdminAuth();
//   const [activeTab, setActiveTab] = useState<keyof typeof TAB_CONFIG>("bloggers");
//
//   const {
//     allBloggers,
//     bloggersWithoutGender,
//     linkRequests,
//     loading,
//     searchLoading,
//     isLoadingMore,
//     hasMoreBloggers,
//     totalBloggersCount,
//     stats,
//     searchTerm,
//     setSearchTerm,
//     showHidden,
//     setShowHidden,
//     fetchBloggers,
//     loadMoreBloggers,
//     approveRequest,
//     rejectRequest,
//     updateBloggerVisibility,
//     updateBloggerGenderLocally,
//     fetchBloggersWithoutGender,
//     loadMoreGenderBloggers,
//     loadingGenderBloggers,
//     hasMoreGenderBloggers,
//     totalGenderBloggersCount,
//     clearGenderCache,
//     isProcessing,
//   } = useAdminBloggers();
//
//   const { addBlogger } = useAdminBloggerActions(() => fetchBloggers(1));
//
//   useEffect(() => {
//     if (activeTab === "gender-selection" && !bloggersWithoutGender.length && !loadingGenderBloggers) {
//       fetchBloggersWithoutGender(1, false);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [activeTab, bloggersWithoutGender.length, loadingGenderBloggers]);
//
//   const handleToggleVisibility = async (bloggerId: number, currentVisibility: boolean) => {
//     try {
//       await adminToggleBloggerVisibility(bloggerId);
//       updateBloggerVisibility(bloggerId, !currentVisibility);
//       toast({
//         title: "Успех",
//         description: `Блогер ${bloggerId} ${currentVisibility ? "показан" : "скрыт"}`,
//       });
//     } catch {
//       toast({
//         title: "Ошибка",
//         description: "Не удалось изменить видимость блогера",
//         variant: "destructive",
//       });
//     }
//   };
//
//   if (loading || adminLoading) {
//     return <LoadingSpinner fullScreen text="Загрузка..." />;
//   }
//
//   return (
//     <div className="min-h-screen bg-gradient-subtle">
//       <AdminHeader />
//
//       <div className="container mx-auto px-4 py-6">
//         <StatsCards stats={stats} />
//
//         <div className="space-y-4 mb-6">
//           <div className="flex gap-4 items-center">
//             <div className="relative flex-1">
//               <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
//               <Input
//                 placeholder="Поиск по имени или username..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="pl-10"
//               />
//             </div>
//             {activeTab === "bloggers" && (
//               <div className="flex items-center space-x-2">
//                 <Checkbox
//                   id="show-hidden"
//                   checked={showHidden}
//                   onCheckedChange={(checked) => setShowHidden(!!checked)}
//                 />
//                 <label htmlFor="show-hidden" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
//                   Показывать скрытых
//                 </label>
//               </div>
//             )}
//           </div>
//
//           <div className="flex gap-2 items-center justify-between">
//             <div className="flex gap-2">
//               {Object.keys(TAB_CONFIG).map((tab) => (
//                 <Button
//                   key={tab}
//                   variant={activeTab === tab ? "default" : "outline"}
//                   onClick={() => setActiveTab(tab as keyof typeof TAB_CONFIG)}
//                   size="sm"
//                 >
//                   {TAB_CONFIG[tab as keyof typeof TAB_CONFIG].label}
//                 </Button>
//               ))}
//             </div>
//             {activeTab === "bloggers" && <AddBloggerDialog onAddBlogger={addBlogger} />}
//           </div>
//
//           {TAB_CONFIG[activeTab].desc && (
//             <div className="text-sm text-muted-foreground">{TAB_CONFIG[activeTab].desc}</div>
//           )}
//         </div>
//
//         {activeTab === "bloggers" && (
//           <BloggersTable
//             bloggers={allBloggers}
//             onToggleVisibility={handleToggleVisibility}
//             formatNumber={formatNumber}
//             searchLoading={searchLoading}
//             isLoadingMore={isLoadingMore}
//             hasMore={hasMoreBloggers}
//             onLoadMore={loadMoreBloggers}
//             totalCount={searchTerm ? allBloggers.length : totalBloggersCount}
//           />
//         )}
//         {activeTab === "gender-selection" && (
//           <GenderSelectionTable
//             bloggers={bloggersWithoutGender}
//             onBloggerGenderUpdated={updateBloggerGenderLocally}
//             loading={loadingGenderBloggers}
//             hasMore={hasMoreGenderBloggers}
//             onLoadMore={loadMoreGenderBloggers}
//             totalCount={totalGenderBloggersCount}
//             onClearCache={clearGenderCache}
//           />
//         )}
//         {activeTab === "link-requests" && (
//           <AdminLinkRequestsTable
//             requests={linkRequests}
//             loading={loading}
//             isProcessing={isProcessing}
//             onApprove={approveRequest}
//             onReject={rejectRequest}
//           />
//         )}
//       </div>
//     </div>
//   );
// };
//
// export default AdminDashboard;