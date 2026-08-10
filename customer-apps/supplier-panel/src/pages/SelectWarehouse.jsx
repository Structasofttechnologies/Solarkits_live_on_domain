import { useDispatch, useSelector } from 'react-redux';
import PageHeader from '../components/PageHeader';
import { FaWarehouse, FaMapMarkerAlt, FaCheckCircle, FaArrowRight } from 'react-icons/fa';
import Button from '../components/Button';
import { selectWarehouse } from '../features/auth.slice';
import { motion } from 'framer-motion';

export default function SelectWarehouse() {
    const dispatch = useDispatch();
    const { warehouseCoverage, activeWarehouse } = useSelector(state => state.auth_slice);

    const warehouses = (warehouseCoverage?.existing_warehouses || []).filter(wh => wh.approval_status === 'approved');

    const getStateName = (stateId) => {
        if (!stateId) return '';
        const idStr = stateId.toString();
        const match = warehouseCoverage?.coverage_states?.find(
            (st) => (typeof st === 'object' ? (st._id?.toString() === idStr || st.id?.toString() === idStr) : st.toString() === idStr)
        );
        return match && typeof match === 'object' ? match.name : stateId;
    };

    const handleSelect = (wh) => {
        dispatch(selectWarehouse(wh));
        // Force full page reload to dashboard home to fully reset context/queries
        window.location.href = '/dashboard/home';
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 py-8 px-4">
            <PageHeader 
                title="Fulfillment Workspace Selection" 
                subtitle="Select the active warehouse you are working from in this session." 
                icon={FaWarehouse}
            />

            {warehouses.length === 0 ? (
                <div className="card p-12 bg-surface border-border flex flex-col items-center text-center space-y-4">
                    <FaWarehouse className="text-4xl text-text-muted/30" />
                    <h3 className="text-lg font-black text-text-primary uppercase tracking-tight">No Warehouses Registered</h3>
                    <p className="text-sm font-semibold text-text-secondary">
                        Please set up your warehouse locations first.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {warehouses.map((wh, idx) => {
                        const isActive = activeWarehouse?._id === wh._id;
                        return (
                            <motion.div 
                                key={wh._id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => handleSelect(wh)}
                                className={`card p-8 bg-surface border-border hover:border-primary/50 cursor-pointer transition-all group relative overflow-hidden ${
                                    isActive ? 'border-primary shadow-lg ring-1 ring-primary/20' : ''
                                }`}
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 gradient-primary opacity-5 -mr-16 -mt-16 rounded-full group-hover:scale-110 transition-transform" />
                                
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-5">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${
                                            isActive ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
                                        }`}>
                                            <FaWarehouse />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-text-primary uppercase tracking-tight truncate max-w-[200px]" title={wh.name}>
                                                {wh.name}
                                            </h3>
                                            <div className="flex items-center gap-1 text-[10px] font-black text-text-muted uppercase tracking-widest mt-1">
                                                <FaMapMarkerAlt className="text-primary" />
                                                {getStateName(wh.state)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-6">
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Address</p>
                                    <p className="text-xs font-semibold text-text-secondary leading-relaxed line-clamp-2" title={wh.address}>
                                        {wh.address}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between pt-5 border-t border-border/50">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                                            Code: {wh.unique_code}
                                        </span>
                                    </div>
                                    {isActive ? (
                                        <span className="text-xs font-bold text-success flex items-center gap-1.5">
                                            <FaCheckCircle /> Active
                                        </span>
                                    ) : (
                                        <Button 
                                            variant="link" 
                                            className="text-[10px] font-black uppercase p-0 transition-transform group-hover:translate-x-1" 
                                            rightIcon={<FaArrowRight />}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSelect(wh);
                                            }}
                                        >
                                            Select Workspace
                                        </Button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
